import * as ec2 from '@aws-cdk/aws-ec2';
import * as firewall from '@aws-cdk/aws-networkfirewall';
import * as cdk from '@aws-cdk/core';

export interface Props extends cdk.StackProps {
  vpc1: ec2.IVpc
  vpc2: ec2.IVpc
  internetVpc: ec2.IVpc
  firewallVpc: ec2.IVpc
  networkFirewallEndpoint: cdk.CfnOutput
}

export class NetworkTransitStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);

    /*
    * Create Transit Gateway
    */
    const transitGateway = new ec2.CfnTransitGateway(this, 'TransitGateway')


    /*
    * Attach a transit gateway to vpcs
    */
    const vpc1Attachment = new ec2.CfnTransitGatewayAttachment(this, 'TransitGatewayAttachmentVpc1', {
      subnetIds: [ 
        props.vpc1.isolatedSubnets[1].subnetId
      ],
      transitGatewayId: transitGateway.ref,
      vpcId: props.vpc1.vpcId,
      tags: [{key: 'Name', value: 'TransitGatewayAttachmentVpc1'}]
    })
    const vpc2Attachment = new ec2.CfnTransitGatewayAttachment(this, 'TransitGatewayAttachmentVpc2', {
      subnetIds: [ 
        props.vpc2.isolatedSubnets[1].subnetId
      ],
      transitGatewayId: transitGateway.ref,
      vpcId: props.vpc2.vpcId,
      tags: [{key: 'Name', value: 'TransitGatewayAttachmentVpc2'}]
    })
    const internetAttachment = new ec2.CfnTransitGatewayAttachment(this, 'TransitGatewayAttachmentInternet', {
      subnetIds: [ 
        props.internetVpc.privateSubnets[0].subnetId
      ],
      transitGatewayId: transitGateway.ref,
      vpcId: props.internetVpc.vpcId,
      tags: [{key: 'Name', value: 'TransitGatewayAttachmentInternet'}]
    })
    const firewallAttachment = new ec2.CfnTransitGatewayAttachment(this, 'TransitGatewayAttachmentfirewall', {
      subnetIds: [ 
        props.firewallVpc.isolatedSubnets[1].subnetId
      ],
      transitGatewayId: transitGateway.ref,
      vpcId: props.firewallVpc.vpcId,
      tags: [{key: 'Name', value: 'TransitGatewayAttachmentfirewall'}]
    })


    /*
    * Edit the subnet route tables
    */
    // Difine dependencies
    const dependsOnAttchements = new cdk.ConcreteDependable();
    dependsOnAttchements.add(vpc1Attachment);
    dependsOnAttchements.add(vpc2Attachment);
    dependsOnAttchements.add(internetAttachment);
    dependsOnAttchements.add(firewallAttachment);

    // Route to vpc2 for workload vpc1
    const vpc1Route1 = new ec2.CfnRoute(this, 'Vpc1Route1', {
      routeTableId: props.vpc1.isolatedSubnets[0].routeTable.routeTableId,
      transitGatewayId: transitGateway.ref,
      destinationCidrBlock: props.vpc2.vpcCidrBlock
    })
    // Route to internet for workload vpc1
    vpc1Route1.node.addDependency(dependsOnAttchements)
    const vpc1Route2 = new ec2.CfnRoute(this, 'Vpc1Route2', {
      routeTableId: props.vpc1.isolatedSubnets[0].routeTable.routeTableId,
      transitGatewayId: transitGateway.ref,
      destinationCidrBlock: '0.0.0.0/0'
    })
    vpc1Route2.node.addDependency(dependsOnAttchements)

    // Route to vpc1 for workload vpc2
    const vpc2Route1 = new ec2.CfnRoute(this, 'Vpc2Route1', {
      routeTableId: props.vpc2.isolatedSubnets[0].routeTable.routeTableId,
      transitGatewayId: transitGateway.ref,
      destinationCidrBlock: props.vpc1.vpcCidrBlock
    })
    vpc2Route1.node.addDependency(dependsOnAttchements)
    // Route to internet for workload vpc2
    const vpc2Route2 = new ec2.CfnRoute(this, 'Vpc2Route2', {
      routeTableId: props.vpc2.isolatedSubnets[0].routeTable.routeTableId,
      transitGatewayId: transitGateway.ref,
      destinationCidrBlock: '0.0.0.0/0'
    })
    vpc2Route2.node.addDependency(dependsOnAttchements)

    // Return way for public subnet in Internet VPC
    const internetVpcRoute1 = new ec2.CfnRoute(this, 'InternetVpcRoute1', {
      routeTableId: props.internetVpc.publicSubnets[0].routeTable.routeTableId,
      transitGatewayId: transitGateway.ref,
      destinationCidrBlock: '10.0.0.0/8'
    })
    internetVpcRoute1.node.addDependency(dependsOnAttchements)
    // Return way for private subnet in Internet VPC
    const internetVpcRoute2 = new ec2.CfnRoute(this, 'InternetVpcRoute2', {
      routeTableId: props.internetVpc.privateSubnets[0].routeTable.routeTableId,
      transitGatewayId: transitGateway.ref,
      destinationCidrBlock: '10.0.0.0/8'
    })
    internetVpcRoute2.node.addDependency(dependsOnAttchements)

    // Route to internet for Firewall VPC
    const firewallVpcRoute1 = new ec2.CfnRoute(this, 'FirewallVpcRoute1', {
      routeTableId: props.firewallVpc.isolatedSubnets[0].routeTable.routeTableId,
      transitGatewayId: transitGateway.ref,
      destinationCidrBlock: '0.0.0.0/0'
    })
    firewallVpcRoute1.node.addDependency(dependsOnAttchements)
    // Route to firewall endpoint for Firewall VPC
    const firewallVpcRoute2 = new ec2.CfnRoute(this, 'FirewallVpcRoute2', {
      routeTableId: props.firewallVpc.isolatedSubnets[1].routeTable.routeTableId,
      vpcEndpointId: props.networkFirewallEndpoint.importValue,
      destinationCidrBlock: '0.0.0.0/0'
    })
    firewallVpcRoute2.node.addDependency(dependsOnAttchements)


    /*
    * Create a transit gateway route table
    */
    // Create a inspection route table
    const inspectionTransitRouteTable = new ec2.CfnTransitGatewayRouteTable(this, 'InspectionTransitGatwayRouteTable', {
      transitGatewayId: transitGateway.ref
    })
    new ec2.CfnTransitGatewayRoute(this, 'TransitGatwayRoute1', {
      transitGatewayRouteTableId: inspectionTransitRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      transitGatewayAttachmentId: firewallAttachment.ref
    })

    // Create a firewall route table
    const firewallTransitRouteTable = new ec2.CfnTransitGatewayRouteTable(this, 'FirewallTransitGatwayRouteTable', {
      transitGatewayId: transitGateway.ref
    })
    new ec2.CfnTransitGatewayRoute(this, 'TransitGatwayRoute2', {
      transitGatewayRouteTableId: firewallTransitRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      transitGatewayAttachmentId: internetAttachment.ref
    })


    /*
    * Propagate attachments to a route table
    */
    new ec2.CfnTransitGatewayRouteTablePropagation(this, 'Vpc1AttachmentPropagation', {
      transitGatewayAttachmentId: vpc1Attachment.ref,
      transitGatewayRouteTableId: firewallTransitRouteTable.ref
    })
    new ec2.CfnTransitGatewayRouteTablePropagation(this, 'Vpc2AttachmentPropagation', {
      transitGatewayAttachmentId: vpc2Attachment.ref,
      transitGatewayRouteTableId: firewallTransitRouteTable.ref
    })
    new ec2.CfnTransitGatewayRouteTablePropagation(this, 'InternetAttachmentPropagation', {
      transitGatewayAttachmentId: internetAttachment.ref,
      transitGatewayRouteTableId: firewallTransitRouteTable.ref
    })


    /*
    * Associate attachments with a route table
    */
    // Associate these with a inspection route table
    new ec2.CfnTransitGatewayRouteTableAssociation(this, 'Vpc1AttachmentAssociation', {
      transitGatewayAttachmentId: vpc1Attachment.ref,
      transitGatewayRouteTableId: inspectionTransitRouteTable.ref
    })
    new ec2.CfnTransitGatewayRouteTableAssociation(this, 'Vpc2AttachmentAssociation', {
      transitGatewayAttachmentId: vpc2Attachment.ref,
      transitGatewayRouteTableId: inspectionTransitRouteTable.ref
    })
    new ec2.CfnTransitGatewayRouteTableAssociation(this, 'InternetAttachmentAssociation', {
      transitGatewayAttachmentId: internetAttachment.ref,
      transitGatewayRouteTableId: inspectionTransitRouteTable.ref
    })

    // Associate firewall attachment with a firewall route table
    new ec2.CfnTransitGatewayRouteTableAssociation(this, 'FirewallAttachmentAssociation', {
      transitGatewayAttachmentId: firewallAttachment.ref,
      transitGatewayRouteTableId: firewallTransitRouteTable.ref
    })

  }
}