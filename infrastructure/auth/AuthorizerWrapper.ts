import { CfnOutput } from "aws-cdk-lib";
import { CognitoUserPoolsAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";



export class AuthorizerWrapper {

  private scope: Construct
  private api: RestApi

  private userPool: UserPool
  private userPoolClient: UserPoolClient
  public authorizer: CognitoUserPoolsAuthorizer


  constructor(scope: Construct, api: RestApi) {
    this.scope = scope
    this.api = api
    this.initialize()
  }

  private initialize() {
    this.createUserPool()
    this.addUserPoolClient()
    this.createAuthorizer()
  }

  private createUserPool() {
    this.userPool = new UserPool(this.scope, 'HolidayUserPool', {
      userPoolName: 'HolidayUserPool',
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true
      }
    })
    new CfnOutput(this.scope, 'UserPoolId', {
      value: this.userPool.userPoolId
    })
  }


  private addUserPoolClient() {
    this.userPoolClient = this.userPool.addClient('HolidayUserPool-Client', {
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userPassword: true,
        userSrp: true
      },
      generateSecret: false
    })
    new CfnOutput(this.scope, 'UserPoolClientId' , {
      value: this.userPoolClient.userPoolClientId
    })
  }

  private createAuthorizer(){
    this.authorizer = new CognitoUserPoolsAuthorizer(this.scope, 'HolidayUserAuthorizer', {
      cognitoUserPools: [this.userPool],
      authorizerName: 'HolidayUserAuthorizer',
      identitySource: 'method.request.header.Authorization',
    })
  }

}