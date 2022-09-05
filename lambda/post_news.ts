
import {APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2} from 'aws-lambda';
import axios from "axios";
import { DynamoDB, PutItemCommandOutput } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";


const tableName = process.env.TABLE;


//https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
//https://dev.to/dvddpl/dynamodb-dynamic-method-to-insert-or-edit-an-item-5fnh
export async function main(event: APIGatewayProxyEventV2WithJWTAuthorizer,): Promise<APIGatewayProxyResultV2> {
    
    const curTime = new Date().getTime()
    const jsonData = event.body ? JSON.parse(event.body) : {};
    const title = jsonData.title;
    const description = jsonData.description;
    

    const PK = event.requestContext.authorizer.jwt.claims.sub.toString()
    const SK = curTime;
   
   
    const ddbClient = new DynamoDB({ region: "us-east-1" });
    const documentClient = DynamoDBDocumentClient.from(ddbClient)
     
      const putItemData: PutCommand = new PutCommand({
        Item: {
          'PK' : PK,
          'SK' : SK,
          "title": title,
          "description": description
        },
        TableName: tableName
      });
    
      const result: PutItemCommandOutput = await documentClient.send(putItemData)
      return {
        statusCode: 200,
        headers: {},
        body: JSON.stringify(result)
      }
   
 
  
 }