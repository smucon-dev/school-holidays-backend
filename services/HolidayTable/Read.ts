import { DynamoDB } from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult, Context } from 'aws-lambda'


const TABLE_NAME = process.env.TABLE_NAME
const PARTITION_KEY = process.env.PARTITION_KEY
const GSI_PARTITION_KEY = process.env.GSI_PARTITION_KEY
const SORT_KEY = process.env.SORT_KEY
const dbClient = new DynamoDB.DocumentClient();

async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: 'DynamoDB - Query executed'
  }

  try {
    if (event.queryStringParameters) {
      let queryPkValue = PARTITION_KEY && PARTITION_KEY in event.queryStringParameters ? event.queryStringParameters[PARTITION_KEY] : undefined
      let querySkValue = SORT_KEY && SORT_KEY in event.queryStringParameters ? event.queryStringParameters[SORT_KEY] : undefined
      if (queryPkValue) {
        result.body = await queryWithPrimaryPartition(queryPkValue, querySkValue)
      } else {
        result.body = await queryWithSecondaryPartition(event.queryStringParameters)
      }
    } else {      
      result.body = await scanTable()
    }
  } catch (error: any) {
    result.body = error.message
  }

  return result

}


async function queryWithPrimaryPartition(queryPkValue: string, querySkValue?: string) {
  if (querySkValue) {
    const queryResponse = await dbClient.query({
      TableName: TABLE_NAME!,
      ExpressionAttributeNames: {"#pk": PARTITION_KEY!, "#sk": SORT_KEY!, "#sDate": 'StartDate', "#eDate": 'EndDate'},
      ExpressionAttributeValues: {":pkv": queryPkValue, ":skv": querySkValue},
      KeyConditionExpression: "#pk = :pkv and begins_with(#sk, :skv)",
      FilterExpression: "contains(#sDate, :skv) and (contains(#sDate, :skv) or contains(#eDate, :skv))"
    }).promise().catch(reject => console.log(reject))
    return JSON.stringify(queryResponse)
  } else {
    const queryResponse = await dbClient.query({
      TableName: TABLE_NAME!,
      ExpressionAttributeNames: {"#pk": PARTITION_KEY!},
      ExpressionAttributeValues: {":pkv": queryPkValue},
      KeyConditionExpression: "#pk = :pkv"
    }).promise().catch(reject => console.log(reject))
    return JSON.stringify(queryResponse)
  }
}


async function queryWithSecondaryPartition(queryParams: APIGatewayProxyEventQueryStringParameters) {
  const queryKey = GSI_PARTITION_KEY
  if (!queryKey) return 'missing query parameter for global secondary index ' + GSI_PARTITION_KEY
  const queryValue = queryParams[queryKey]

  // query for secondary index partition key and sort key
  if (SORT_KEY && queryParams[SORT_KEY]) {
    const sortValue = queryParams[SORT_KEY]
    const queryResponse = await dbClient.query({
      TableName: TABLE_NAME!,
      IndexName: `GSI_${queryKey}`,
      ExpressionAttributeNames: {"#zz": queryKey!, "#sDate": 'StartDate', "#eDate": 'EndDate'},
      ExpressionAttributeValues: {":zzz": queryValue, ":xxx": sortValue},
      KeyConditionExpression: "#zz = :zzz",
      FilterExpression: "contains(#sDate, :xxx) and (contains(#sDate, :xxx) or contains(#eDate, :xxx))"
    }).promise().catch(reject => console.log(reject))
    return JSON.stringify(queryResponse)
  } 
  // query for secondary index partition key
  else {
    const queryResponse = await dbClient.query({
      TableName: TABLE_NAME!,
      IndexName: `GSI_${queryKey}`,
      ExpressionAttributeNames: {"#zz": queryKey!},
      ExpressionAttributeValues: {":zzz": queryValue},
      KeyConditionExpression: "#zz = :zzz"
    }).promise().catch(reject => console.log(reject))
    return JSON.stringify(queryResponse)
  }
}


async function scanTable() {
  const queryResponse = await dbClient.scan({
    TableName: TABLE_NAME!
  }).promise()
  return JSON.stringify(queryResponse)
}



export { handler }