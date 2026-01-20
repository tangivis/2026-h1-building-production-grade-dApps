## Quick Start
```shell
yarn install

npx hardhat node

npx hardhat test
```
## localNode
```shell
npx hardhat run scripts/deploy.ts --network localNode

# proxyAddress=""
npx hardhat run scripts/upgradeV1.ts --network localNode
# proxyAddress=""
npx hardhat run scripts/interact.ts --network localNode

```


## passetHub
```shell
npx hardhat run scripts/deploy.ts --network passetHub
# UUPSBoxV1 Proxy deployed to: 0x6E50b5F95ea8ADa5E1549527bfFA514ee35024cA
# Deployment Transaction Hash: 0x562677e5161ff38431a2af5432e0aeea7e1c3cf195b23e6f4a9be4c7f43529c4
npx hardhat run scripts/upgradeV1.ts --network passetHub
# proxyAddress="0x6E50b5F95ea8ADa5E1549527bfFA514ee35024cA"
npx hardhat run scripts/interact.ts --network passetHub
```
### 合约地址
> https://polkadot.testnet.routescan.io/address/0x6E50b5F95ea8ADa5E1549527bfFA514ee35024cA

```shell
➜  uups-evm git:(main) ✗ npx hardhat run scripts/deploy.ts --network passetHub             
Deploying UUPSBoxV1...
UUPSBoxV1 Proxy deployed to: 0x6E50b5F95ea8ADa5E1549527bfFA514ee35024cA
Deployment Transaction Hash: 0x562677e5161ff38431a2af5432e0aeea7e1c3cf195b23e6f4a9be4c7f43529c4
```
```shell
➜  uups-evm git:(main) ✗ npx hardhat run scripts/upgradeV1.ts --network passetHub
Preparing upgrade...
Implementation deployed to: 0x80Adb71Cd5b2861713FBC6E287cEBa9E9a4E8eF3
Upgrading proxy...
Upgrade Transaction Hash: 0x0a685f1acc1d95cc26db06f4f8c2b4118793874a892ebb72d0db889cdf917d24
Proxy upgraded at: 0x6E50b5F95ea8ADa5E1549527bfFA514ee35024cA
Syncing upgrades manifest...

```
```shell
➜  uups-evm git:(main) ✗ npx hardhat run scripts/interact.ts --network passetHub
--- 读取升级前状态 ---
Value (Should be 42): 42
Name (Should be V1_Box): UUPS_Box

--- 调用 V2 新功能 ---
--- 读取升级后状态 ---
Value (Should be 43): 43
Name (Should be V1_Box): UUPS_Box
LastUpgradeTime (Should be > 0): 1768830156
```