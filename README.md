# Wallet Aggregator SDK


This is a fork of the original [XLabs/wallet-aggregator-sdk](https://github.com/XLabs/wallet-aggregator-sdk).

A library to transparently interact with multiple blockchains

`bun` is used to manage the project. To install, simply clone the repo and run:

#### Setup

```bash
$ bun install
```

#### Building

```bash
$ bun run build
```

### Packages

For more information, check each package README:

| Package                                                                    | Description                                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------- |
| [@wormhole-labs/wallet-aggregator-core](./packages/wallets/core)           | Base package. Provides the core Wallet abstractions      |
| [@wormhole-labs/wallet-aggregator-react](./packages/react)                 | React Context component & hooks to interact with wallets |
| [@wormhole-labs/wallet-aggregator-algorand](./packages/wallets/algorand)   | Wallet implementation for Algorand                       |
| [@wormhole-labs/wallet-aggregator-aptos](./packages/wallets/aptos)         | Wallet implementation for Aptos                          |
| [@wormhole-labs/wallet-aggregator-evm](./packages/wallets/evm)             | Wallet implementation for EVM chains                     |
| [@wormhole-labs/wallet-aggregator-injective](./packages/wallets/injective) | Wallet implementation for Injective                      |
| [@wormhole-labs/wallet-aggregator-near](./packages/wallets/near)           | Wallet implementation for Near                           |
| [@wormhole-labs/wallet-aggregator-solana](./packages/wallets/solana)       | Wallet implementation for Solana                         |
| [@wormhole-labs/wallet-aggregator-stacks](./packages/wallets/stacks)       | Wallet implementation for Stacks                         |
| [@wormhole-labs/wallet-aggregator-xpla](./packages/wallets/xpla)           | Wallet implementation for XPLA                           |
| [@wormhole-labs/wallet-aggregator-terra](./packages/wallets/terra)         | Wallet implementation for Terra                          |
