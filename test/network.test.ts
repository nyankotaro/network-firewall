import { expect as expectCDK, matchTemplate, MatchStyle, countResources } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Network from '../lib/network-vpc-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Network.NetworkVpcStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(countResources('AWS::EC2::VPC', 2));
});
