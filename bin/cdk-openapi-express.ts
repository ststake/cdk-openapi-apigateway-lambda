#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkOpenapiExpressStack } from "../lib/cdk-openapi-express-stack";

const app = new cdk.App();
new CdkOpenapiExpressStack(app, "CdkOpenapiExpressStack", {});
