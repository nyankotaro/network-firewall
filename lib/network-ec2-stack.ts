import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';

export interface Props extends cdk.StackProps {
  vpc1: ec2.IVpc
  vpc2: ec2.IVpc
  internetVpc: ec2.IVpc
}

export class NetworkEc2Stack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);

    /*
    * Create a Role
    */
    const role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    })
    role.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, 'ManagedPolicy', 'arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM'))

    /*
    * Create Instances
    */
    // Instance on Workload vpc1
    const instance1 = new ec2.Instance(this, 'Vpc1Instance', {
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
      }),
      vpc: props.vpc1,
      role: role,
      vpcSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetAttributes(this, 'Vpc1Private', {
            subnetId: props.vpc1.isolatedSubnets[0].subnetId,
            availabilityZone: props.vpc1.isolatedSubnets[0].availabilityZone
          })
        ]
      }
    })
    instance1.connections.allowFrom(
      ec2.Peer.ipv4('10.0.0.0/13'),
      ec2.Port.allTraffic()
    )

    // Instance on Workload vpc2
    const instance2 = new ec2.Instance(this, 'Vpc2Instance', {
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2019_JAPANESE_FULL_BASE),
      vpc: props.vpc2,
      keyName: 'ko-takayama@nec.com-keypair',
      role: role,
      vpcSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetAttributes(this, 'Vpc2Private', {
            subnetId: props.vpc2.isolatedSubnets[0].subnetId,
            availabilityZone: props.vpc2.isolatedSubnets[0].availabilityZone
          })
        ]
      }
    })
    instance2.connections.allowFrom(
      ec2.Peer.ipv4('10.0.0.0/13'),
      ec2.Port.allTraffic()
    )

  }
}