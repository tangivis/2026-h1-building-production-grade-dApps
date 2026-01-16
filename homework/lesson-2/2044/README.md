# Polkadot/Substrate 与以太坊兼容链交互示例

这是一个演示如何在 Polkadot/Substrate 链和以太坊兼容链之间进行交互的 TypeScript 项目。

## 安装

在两个终端中分别运行：

**终端 1 - Substrate 节点:**
```bash
./target/release/substrate-node --dev
```

**终端 2 - ETH RPC:**
```bash
./target/release/eth-rpc --dev
```

```bash
yarn install
```

## 运行

```bash
yarn start
```

**注意**: 运行前需要启动本地开发链节点：
- WebSocket RPC: `localhost:9944`
- HTTP RPC: `localhost:8545`

## 功能模块

### 1. accounts.ts - 账户管理
- `getAlice()` - 获取 Alice 测试账户
- `getRandomSubstrateKeypair()` - 生成随机 Substrate 密钥对
- `convertPublicKeyToSs58()` - 将公钥转换为 SS58 地址
- `accountId32ToH160()` - 将 AccountId32 转换为以太坊地址（H160）
- `h160ToAccountId32()` - 将以太坊地址转换为 AccountId32

### 2. utils.ts - 工具函数
- `getApi(isLocal)` - 获取 Polkadot API 客户端
- `getProvider(isLocal)` - 获取以太坊 Provider
- `setBalance()` - 设置账户余额（需要 sudo 权限）

### 3. erc20.ts - ERC20 代币操作
- `createERC20Asset()` - 在 Substrate 链上创建资产
- `getERC20Balance()` - 查询 ERC20 代币余额

### 4. precompile.ts - 预编译合约
- `callWithoutSelector()` - 调用预编译合约（Hash 预编译）

### 5. index.ts - 主程序
包含多个示例函数：
- `getBalance_alice()` - 查询 Alice 账户在 Substrate 和以太坊链上的余额
- `getBalance_alithe()` - 从以太坊私钥查询对应地址的余额
- `getBalance3()` - 生成随机账户并设置余额的示例

## 依赖

- `polkadot-api` - Polkadot API 客户端
- `ethers` - 以太坊交互库
- `@polkadot-labs/hdkd` - HD 密钥派生
- `@polkadot-api/descriptors` - API 描述符

## 配置

支持本地开发链和测试网：
- 本地: `localhost:8545` (HTTP), `localhost:9944` (WebSocket)
- 测试网: Polkadot Hub Paseo 测试网
