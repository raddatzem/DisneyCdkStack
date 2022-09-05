
import {APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2} from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, ScanCommandOutput } from "@aws-sdk/lib-dynamodb";


const tableName = process.env.TABLE;


//https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
//https://dev.to/dvddpl/dynamodb-dynamic-method-to-insert-or-edit-an-item-5fnh
export async function main(event: APIGatewayProxyEventV2WithJWTAuthorizer,): Promise<APIGatewayProxyResultV2> {
    const ddbClient = new DynamoDB({ region: "us-east-1" });
    const documentClient = DynamoDBDocumentClient.from(ddbClient)
    
     
      //https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property
      const queryTable: ScanCommand = new ScanCommand({
        TableName: tableName
      });
    
    
      const result: ScanCommandOutput = await documentClient.send(queryTable)
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(result)
      }
   
   
 
  
 }