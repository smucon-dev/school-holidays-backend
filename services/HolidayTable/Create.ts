import { DynamoDB } from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { MissingFieldError, validateAsHolidayEntry } from '../shared/InputValidator'
import { getEventBody } from '../shared/Utils'


const TABLE_NAME = process.env.TABLE_NAME
const PARTITION_KEY = process.env.PARTITION_KEY
const dbClient = new DynamoDB.DocumentClient();

async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

  const result: APIGatewayProxyResult = {
    statusCode: 200,
    body: 'DynamoDB - Create ation executed'
  }

  try {
    const item = getEventBody(event)
    validateAsHolidayEntry(item)    
    await dbClient.put({
      TableName: TABLE_NAME!,
      Item: item,
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {'#pk': PARTITION_KEY!}
    }).promise()
    result.body = 'Item created: ' + JSON.stringify(item)
  } catch (error: any) {
    if (error instanceof MissingFieldError) {
      result.statusCode = 403
    } else {
      result.statusCode = 500
    }
    result.body = error.message
  }

  return result

}

export { handler }