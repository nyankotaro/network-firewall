import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';

export class NetworkVpcStack extends cdk.Stack {

  public readonly vpc1: ec2.IVpc
  public readonly vpc2: ec2.IVpc
  public readonly internetVpc: ec2.IVpc
  public readonly firewallVpc: ec2.IVpc


  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*
    * Create vpcs
    */
    this.vpc1 = new ec2.Vpc(this, 'Workload VPC1', {
      cidr: "10.1.0.0/16",
      natGateways: 0,
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Instance',
          subnetType: ec2.SubnetType.ISOLATED
        },
        {
          cidrMask: 28,
          name: 'Transit',
          subnetType: ec2.SubnetType.ISOLATED
        }
      ]
    })

    this.vpc2 = new ec2.Vpc(this, 'Workload VPC2', {
      cidr: "10.2.0.0/16",
      natGateways: 0,
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Instance',
          subnetType: ec2.SubnetType.ISOLATED
        },
        {
          cidrMask: 28,
          name: 'Transit',
          subnetType: ec2.SubnetType.ISOLATED
        }
      ]
    })

    this.internetVpc = new ec2.Vpc(this, 'Internet VPC', {
      cidr: "10.3.0.0/16",
      natGateways: 1,
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Internet',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 28,
          name: 'Transit',
          subnetType: ec2.SubnetType.PRIVATE
        }
      ]
    })

    this.firewallVpc = new ec2.Vpc(this, 'Firewall VPC', {
      cidr: "100.1.0.0/16",
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Firewall',
          subnetType: ec2.SubnetType.ISOLATED
        },
        {
          cidrMask: 28,
          name: 'Transit',
          subnetType: ec2.SubnetType.ISOLATED
        }
      ]
    })

  }
}
