import { JsonFileLogDriver } from 'aws-cdk-lib/aws-ecs';
import {APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2} from 'aws-lambda';
import axios from "axios";



const apiKey = process.env.API_KEY
//https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
//https://dev.to/dvddpl/dynamodb-dynamic-method-to-insert-or-edit-an-item-5fnh
export async function main(event: APIGatewayProxyEventV2WithJWTAuthorizer,): Promise<APIGatewayProxyResultV2> {
    const response = await axios.get(`https://newsapi.org/v2/everything?q=disney&apiKey=${apiKey}`)
   
    return {
        statusCode: 200, //TODO: Fix
        headers: {},
        body: JSON.stringify(response.data)
    }
  
 }
 
  