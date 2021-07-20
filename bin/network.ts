#!/usr/bin/env node
import 'source-map-support/register';
import * as iam from '@aws-cdk/aws-iam'
import * as cdk from '@aws-cdk/core';
import { NetworkVpcStack } from '../lib/network-vpc-stack';
import { NetworkEc2Stack } from '../lib/network-ec2-stack';
import { NetworkTransitStack } from '../lib/network-transit-stack';
import { NetworkFirewallStack } from '../lib/network-firewall-stack';
import { NetworkVerifyStack } from '../lib/network-verify-stack';

const app = new cdk.App();
const vpcStack = new NetworkVpcStack(app, 'NetworkVpcStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
})
const ec2Stack = new NetworkEc2Stack(app, 'NetworkEc2Stack', {
  vpc1: vpcStack.vpc1,
  vpc2: vpcStack.vpc2,
  internetVpc: vpcStack.internetVpc,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
})
const firewallStack = new NetworkFirewallStack(app, 'NetworkFirewallStack', {
  firewallVpc: vpcStack.firewallVpc,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
})
new NetworkTransitStack(app, 'NetworkTransitStack', {
  vpc1: vpcStack.vpc1,
  vpc2: vpcStack.vpc2,
  internetVpc: vpcStack.internetVpc,
  firewallVpc: vpcStack.firewallVpc,
  networkFirewallEndpoint: firewallStack.networkFirewallEndpoint,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
})

// Uncomment if you want to use the permission boundary
// const account_id = cdk.Stack.of(vpcStack).account;
// iam.PermissionsBoundary.of(ec2Stack).apply(iam.ManagedPolicy.fromManagedPolicyArn(ec2Stack, 'PermissionBoundary', 'arn:aws:iam::' + account_id + ':policy/adm_skill-up_scope-permissions'));
