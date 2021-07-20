# Transit Gatway × Network Firewallなアウトバウンドインターネットアーキテクチャ

## アーキテクチャ

![network-firewall](./network-firewall.svg)

## 外部VPCからのトラフックをドメイン検査できるように更新する

- 現在のルールグループのJSONリストを取得

```cmd
aws network-firewall describe-rule-group --type STATEFUL ^
--rule-group-name CentralNetworkFirewallStateFullRule --region ap-northeast-1
```

- 定義したvariables.jsonでルールグループを更新

```cmd
aws network-firewall update-rule-group ^
--rule-group-arn arn:aws:network-firewall:<region>:<account-id>:stateful-rulegroup/CentralNetworkFirewallStatelessRule ^
--update-token <token> ^
--rule-group file://variables.json ^
--region ap-northeast-1
```
