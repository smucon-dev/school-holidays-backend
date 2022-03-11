import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import { RestApi, AuthorizationType, MethodOptions } from 'aws-cdk-lib/aws-apigateway'
import { GenericTable, TableProps } from './GenericTable';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { AuthorizerWrapper } from './auth/AuthorizerWrapper'



export class HolidayStack extends Stack {

  private api = new RestApi(this, 'HolidayApi')
  private authorizer: AuthorizerWrapper

  private holidayTableProps: TableProps = {
    tableName: 'Holiday',
    partitionKey: 'State',
    sortKey: 'SK',
    gsiProps: {
      indexName: 'GSI_Type',
      partitionKey: {
        name: 'Type',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'SK',
        type: AttributeType.STRING
      }
    },
    createLambdaPath: 'Create',
    readLambdaPath: 'Read',
    updateLambdaPath: 'Update',
    deleteLambdaPath: 'Delete'
  }

  private holidayTable = new GenericTable(this, this.holidayTableProps)


  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    this.authorizer = new AuthorizerWrapper(this, this.api)

    const methodOptions: MethodOptions = {
      authorizer: this.authorizer.authorizer,
      authorizationType: AuthorizationType.COGNITO
    }

    // Holiday API integrations
    const holidayResource = this.api.root.addResource('holidays')
    holidayResource.addMethod('GET', this.holidayTable.readLambdaIntegration)
    holidayResource.addMethod('POST', this.holidayTable.createLambdaIntegration, methodOptions)
    holidayResource.addMethod('PUT', this.holidayTable.updateLambdaIntegration, methodOptions)
    holidayResource.addMethod('DELETE', this.holidayTable.deleteLambdaIntegration, methodOptions)

  }

}