import * as ec2 from '@aws-cdk/aws-ec2';
import * as firewall from '@aws-cdk/aws-networkfirewall';
import * as cdk from '@aws-cdk/core';

export interface Props extends cdk.StackProps {
  firewallVpc: ec2.IVpc
}

export class NetworkFirewallStack extends cdk.Stack {

  public readonly networkFirewallEndpoint: cdk.CfnOutput

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);

    /*
    * Create a Firewall stateless rule
    */
    const stateFullRule = new firewall.CfnRuleGroup(this, 'StateFullRule', {
      capacity: 100,
      ruleGroupName: 'CentralNetworkFirewallStateFullRule',
      type: 'STATEFUL',
      ruleGroup: {
        rulesSource: {
          rulesSourceList: {
            generatedRulesType: 'DENYLIST',
            targets: ['.yahoo.co.jp'],
            targetTypes: ['TLS_SNI', 'HTTP_HOST'],
          },
        },
      },
    })

    /*
    * Create a Network firewall policy
    */
    const networkFirewallPolicy = new firewall.CfnFirewallPolicy(this, 'NetworkFirewallPolicy', {
      firewallPolicy: {
        statelessDefaultActions: ['aws:forward_to_sfe'],
        statelessFragmentDefaultActions: ['aws:forward_to_sfe'],
        statefulRuleGroupReferences: [{resourceArn: stateFullRule.ref}],
      },
      firewallPolicyName: 'CentralNetworkFirewallPolicy'
    })

    /*
    * Create a Network firewall
    */
    const networkFirewall = new firewall.CfnFirewall(this, 'NetworkFirewall', {
      firewallName: 'CentralNetworkFirewall',
      firewallPolicyArn: networkFirewallPolicy.ref,
      subnetMappings: [{subnetId: props.firewallVpc.isolatedSubnets[0].subnetId}], 
      vpcId: props.firewallVpc.vpcId
    })

    // Output network firewall parameter
    this.networkFirewallEndpoint = new cdk.CfnOutput(this, 'NetworkFirewallOutput', {
      value: cdk.Fn.select(1 ,cdk.Fn.split(':', cdk.Fn.select(0, networkFirewall.attrEndpointIds))),
      exportName: 'NetworkFirwallEndpoint'
    })

  }
}
