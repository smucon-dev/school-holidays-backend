import { DynamoDB } from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { getEventBody } from '../shared/Utils';


const TABLE_NAME = process.env.TABLE_NAME
const PARTITION_KEY = process.env.PARTITION_KEY
const dbClient = new DynamoDB.DocumentClient();


async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: 'DynamoDB - Item updated'
  }

  const item = getEventBody(event)

  try {
    await dbClient.put({
      TableName: TABLE_NAME!,
      Item: item,
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {'#pk': PARTITION_KEY!}
    }).promise().catch(error => console.log(error))
  } catch (error: any) {
    result.body = error.message
  }

  return result

}

export { handler }