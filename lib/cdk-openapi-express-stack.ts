import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  aws_iam as iam,
  aws_apigateway as apigateway,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as fs from "fs";
import * as yaml from "yaml";

export class CdkOpenapiExpressStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // lambda
    const fn = new NodejsFunction(this, "express-lambda", {
      entry: "./api/src/index.ts",
      handler: "handler",
      bundling: {
        forceDockerBundling: false,
      },
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      },
    });

    // apigateway from openapi
    const swaggerYaml = yaml.parse(
      fs.readFileSync("./api/docs/openapi.yaml").toString()
    );

    for (const path in swaggerYaml.paths) {
      for (const method in swaggerYaml.paths[path]) {
        swaggerYaml.paths[path][method]["x-amazon-apigateway-integration"] = {
          uri: `arn:${cdk.Aws.PARTITION}:apigateway:${cdk.Aws.REGION}:lambda:path/2015-03-31/functions/${fn.functionArn}/invocations`,
          passthroughBehavior: "when_no_match",
          httpMethod: "POST",
          type: "aws_proxy",
        };
      }
    }

    const apigw = new apigateway.SpecRestApi(this, "RestApi", {
      apiDefinition: apigateway.ApiDefinition.fromInline(swaggerYaml),
      restApiName: "restApi",
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      deployOptions: {
        description: "An OpenAPI Gateway",
        stageName: "v1",
        // loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        // metricsEnabled: true,
        // dataTraceEnabled: true
      },
    });

    fn.addPermission("LambdaPermisson", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: apigw.arnForExecuteApi(),
    });

    // output
    new CfnOutput(this, "ApigatewayURL", {
      value: apigw.urlForPath(),
      description: "Apigateway URL",
    });
  }
}
