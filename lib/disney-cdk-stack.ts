import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {aws_cognito, Duration} from 'aws-cdk-lib';

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

  new cdk.CfnOutput(this, 'region', {value: cdk.Stack.of(this).region});
  new cdk.CfnOutput(this, 'userPoolId', {value: userPool.userPoolId});
  new cdk.CfnOutput(this, 'userPoolClientId', {
    value: userPoolClient.userPoolClientId,
  });

  }
}
