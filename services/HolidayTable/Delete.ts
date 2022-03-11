import { DynamoDB } from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'


const TABLE_NAME = process.env.TABLE_NAME as string
const PARTITION_KEY = process.env.PARTITION_KEY as string
const SORT_KEY = process.env.SORT_KEY as string
const dbClient = new DynamoDB.DocumentClient();

async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: 'DynamoDB - Item deleted'
  }

  try {
    if (event.queryStringParameters) {
      let queryPkValue = PARTITION_KEY && PARTITION_KEY in event.queryStringParameters ? event.queryStringParameters[PARTITION_KEY] : undefined
      let querySkValue = SORT_KEY && SORT_KEY in event.queryStringParameters ? event.queryStringParameters[SORT_KEY] : undefined
      if (queryPkValue && querySkValue) {
        await dbClient.delete({
          TableName: TABLE_NAME!,
          Key: {
            [PARTITION_KEY]: queryPkValue,
            [SORT_KEY]: querySkValue
          }
        }).promise().catch(error => console.log(error))
      } else {
        result.body = 'item not found'
      }
    } 
  } catch (error: any) {
    result.body = error.message
  }

  return result

}

export { handler }