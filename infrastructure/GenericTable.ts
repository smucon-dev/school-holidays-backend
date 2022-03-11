import { Stack } from 'aws-cdk-lib'
import { LambdaIntegration } from 'aws-cdk-lib/aws-apigateway'
import { AttributeType, GlobalSecondaryIndexProps, Table } from 'aws-cdk-lib/aws-dynamodb'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { join } from 'path'


export interface TableProps {
  tableName: string,
  partitionKey: string,
  sortKey?: string,
  gsiProps?: GlobalSecondaryIndexProps,
  createLambdaPath?: string,
  readLambdaPath?: string,
  updateLambdaPath?: string,
  deleteLambdaPath?: string,
}


export class GenericTable {

  private stack: Stack
  private props: TableProps
  private table: Table

  private createLambda: NodejsFunction | undefined
  private readLambda: NodejsFunction | undefined
  private updateLambda: NodejsFunction | undefined
  private deleteLambda: NodejsFunction | undefined

  public createLambdaIntegration: LambdaIntegration
  public readLambdaIntegration: LambdaIntegration
  public updateLambdaIntegration: LambdaIntegration
  public deleteLambdaIntegration: LambdaIntegration


  public constructor(stack: Stack, props: TableProps) {
    this.stack = stack
    this.props = props
    this.initialize()
  }

  private initialize() {
    this.createTable()
    this.createLambdas()
    this.grantTableRights()
  }

  // create Table
  private createTable() {

    // partition key and table name
    const tableProps: any = {
      partitionKey: {
        name: this.props.partitionKey,
        type: AttributeType.STRING
      },
      tableName: this.props.tableName
    }

    // sort key
    if (this.props.sortKey) {
      tableProps['sortKey'] = {
        name: this.props.sortKey,
        type: AttributeType.STRING
      }
    }

    this.table = new Table(this.stack, this.props.tableName, tableProps)

    if (this.props.gsiProps) {
      this.table.addGlobalSecondaryIndex(this.props.gsiProps)
    }
  }

  // create Lambdas
  private createLambdas() {
    if (this.props.createLambdaPath) {
      this.createLambda = this.createSingleLambda(this.props.createLambdaPath)
      this.createLambdaIntegration = new LambdaIntegration(this.createLambda)
    }
    if (this.props.readLambdaPath) {
      this.readLambda = this.createSingleLambda(this.props.readLambdaPath)
      this.readLambdaIntegration = new LambdaIntegration(this.readLambda)
    }
    if (this.props.updateLambdaPath) {
      this.updateLambda = this.createSingleLambda(this.props.updateLambdaPath)
      this.updateLambdaIntegration = new LambdaIntegration(this.updateLambda)
    }
    if (this.props.deleteLambdaPath) {
      this.deleteLambda = this.createSingleLambda(this.props.deleteLambdaPath)
      this.deleteLambdaIntegration = new LambdaIntegration(this.deleteLambda)
    }
  }

  // grant table rights
  private grantTableRights() {
    if(this.createLambda) {
      this.table.grantWriteData(this.createLambda)
    }
    if(this.readLambda) {
      this.table.grantReadData(this.readLambda)
    }
    if(this.updateLambda) {
      this.table.grantWriteData(this.updateLambda)
    }
    if(this.deleteLambda) {
      this.table.grantWriteData(this.deleteLambda)
    }
  }

  // create a single lambda function
  private createSingleLambda(lambdaName: string): NodejsFunction {
    const lambdaId = `${this.props.tableName}-${lambdaName}`
    return new NodejsFunction(this.stack, lambdaId, {
      entry: (join(__dirname, '..', 'services', `${this.props.tableName}Table`, `${lambdaName}.ts`)),
      handler: 'handler',
      functionName: lambdaId,
      environment: {
        TABLE_NAME: this.props.tableName,
        PARTITION_KEY: this.props.partitionKey,
        GSI_PARTITION_KEY: this.props.gsiProps ? this.props.gsiProps.partitionKey.name : '',
        SORT_KEY: this.props.sortKey ? this.props.sortKey : ''
      }
    })
  }

}