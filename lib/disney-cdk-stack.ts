import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {aws_cognito, Duration} from 'aws-cdk-lib';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from 'path';
import {HttpMethod} from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apiGatewayIntegrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as apiGateway from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apiGatewayAuthorizers from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';


interface DisneyStackProps extends cdk.StackProps{
  deploymentEnvironment: 'alpha' | 'prod'
}

export class DisneyCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DisneyStackProps) {
    super(scope, id, props);
    const userPoolName = 'disneyusers'
    const userPool = new aws_cognito.UserPool(this, userPoolName, {
      userPoolName: userPoolName,
      selfSignUpEnabled: true,
      removalPolicy: props?.deploymentEnvironment == 'alpha' ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      userVerification: { //self sign-up
          emailSubject: 'Verify your email for our awesome app!',
          emailBody: 'Thanks for signing up to our awesome app! Your verification code is {####}',
          emailStyle: aws_cognito.VerificationEmailStyle.CODE,
          smsMessage: 'Thanks for signing up to our awesome app! Your verification code is {####}',
      },
      userInvitation: { //Admin signing users up
          emailSubject: 'Invite to join our awesome app!',
          emailBody: 'Hello {username}, you have been invited to join our awesome app! Your temporary password is {####}',
          smsMessage: 'Hello {username}, your temporary password for our awesome app is {####}',
      },
      signInAliases: {
          email: true,
          preferredUsername: true,
          username: true
      },
      signInCaseSensitive:false,
      standardAttributes: {
          email: {
              required: true,
              mutable: true
          },
          preferredUsername: {
              required: false,
              mutable: true
          }
      },
      customAttributes: {
          'isCreator': new aws_cognito.BooleanAttribute({ mutable: true }),
          'joinedOn': new aws_cognito.DateTimeAttribute(),
      },
      passwordPolicy: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireDigits: true,
          requireSymbols: false,
          tempPasswordValidity: Duration.days(3),
      },
      accountRecovery: aws_cognito.AccountRecovery.EMAIL_ONLY,
      deviceTracking: {
          challengeRequiredOnNewDevice: true,
          deviceOnlyRememberedOnUserPrompt: false,
      },
  })

  // 👇 create the user pool client
  //https://github.com/bobbyhadz/aws-cdk-api-authorizer/blob/cdk-v2/lib/cdk-starter-stack.ts
  const userPoolClient = new aws_cognito.UserPoolClient(this, `${userPoolName}-client`, {
    userPool,
    authFlows: {
      adminUserPassword: true,
      userPassword: true,
      custom: true,
      userSrp: true,
    },
    supportedIdentityProviders: [
      aws_cognito.UserPoolClientIdentityProvider.COGNITO,
    ],
  });

/////start lambda funtion logic
  const getNewsLambdaFunction = new lambdaNodeJs.NodejsFunction(this, `getNews-handler`, {
    runtime: lambda.Runtime.NODEJS_16_X, // So we can use async in widget.js
    entry: path.join(__dirname, `/../lambda/get_news.ts`),
    handler: "main",
    environment: {
      //@ts-ignore
      API_KEY: process.env.API_KEY
    },
    memorySize: 1024,
    timeout: cdk.Duration.seconds(5),
    functionName: `getNews-function`
  });
  const getCruiseLambdaFunction = new lambdaNodeJs.NodejsFunction(this, `getCruise-handler`, {
    runtime: lambda.Runtime.NODEJS_16_X, // So we can use async in widget.js
    entry: path.join(__dirname, `/../lambda/get_cruise.ts`),
    handler: "main",
    environment: {
      //@ts-ignore
      API_KEY: process.env.API_KEY
    },
    memorySize: 1024,
    timeout: cdk.Duration.seconds(5),
    functionName: `getCruise-function`
  });
  const getWorldLambdaFunction = new lambdaNodeJs.NodejsFunction(this, `getWorld-handler`, {
    runtime: lambda.Runtime.NODEJS_16_X, // So we can use async in widget.js
    entry: path.join(__dirname, `/../lambda/get_dworld.ts`),
    handler: "main",
    environment: {
      //@ts-ignore
      API_KEY: process.env.API_KEY
    },
    memorySize: 1024,
    timeout: cdk.Duration.seconds(5),
    functionName: `getWorld-function`
  });

  const api = new apiGateway.HttpApi(this, `news-api`, {
    apiName: "news_api",
    description: `News API`,
  });

   ////////// 👇 create the Authorizer //////////////
   const authorizer = new apiGatewayAuthorizers.HttpUserPoolAuthorizer(
    `${userPoolName}-authorizer`,
    userPool,
    {
      userPoolClients: [userPoolClient],
      identitySource: ['$request.header.Authorization'],
    },
  );
  ////////////////////////////////////////////

  const postNewsLambdaFunction = new lambdaNodeJs.NodejsFunction(this, `postNews-handler`, {
    runtime: lambda.Runtime.NODEJS_16_X, // So we can use async in widget.js
    entry: path.join(__dirname, `/../lambda/post_news.ts`),
    handler: "main",
    environment: {
      //@ts-ignore
      API_KEY: process.env.API_KEY
    },
    memorySize: 1024,
    timeout: cdk.Duration.seconds(5),
    functionName: `postNews-function`
  });
//////////////////???????????

api.addRoutes({
  integration: new apiGatewayIntegrations.HttpLambdaIntegration(
    `post-news-api`,
    postNewsLambdaFunction,
  ),
  path: '/post-news-api',
  //authorizer, Do not need authorizer
  methods: [HttpMethod.POST]
});

/////////////////////////////////////////////////////
  api.addRoutes({
    integration: new apiGatewayIntegrations.HttpLambdaIntegration(
      `get-news-api`,
      getNewsLambdaFunction,
    ),
    path: '/get-news-api',
    //authorizer, Do not need authorizer
    methods: [HttpMethod.GET]
  });
  api.addRoutes({
    integration: new apiGatewayIntegrations.HttpLambdaIntegration(
      `get-disney-cruise-news`,
      getCruiseLambdaFunction,
    ),
    path: '/get-disney-cruise-news',
    //authorizer, Do not need authorizer
    methods: [HttpMethod.GET]
  });
  api.addRoutes({
    integration: new apiGatewayIntegrations.HttpLambdaIntegration(
      `get-disney-world-news`,
      getWorldLambdaFunction,
    ),
    path: '/get-disney-world-news',
    //authorizer, Do not need authorizer
    methods: [HttpMethod.GET]
  });


  new cdk.CfnOutput(this, 'apiUrl', {
    value: api.url!
  })

//////////////////////////////////////////////////////////////////////



  new cdk.CfnOutput(this, 'region', {value: cdk.Stack.of(this).region});
  new cdk.CfnOutput(this, 'userPoolId', {value: userPool.userPoolId});
  new cdk.CfnOutput(this, 'userPoolClientId', {
    value: userPoolClient.userPoolClientId,
  });

  }
}
