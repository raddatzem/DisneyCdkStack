#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DisneyCdkStack } from '../lib/disney-cdk-stack';

const app = new cdk.App();
new DisneyCdkStack(app, 'DisneyCdkStack', {
  deploymentEnvironment: 'alpha',
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT
  },
 
});