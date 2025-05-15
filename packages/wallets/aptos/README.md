## Wallet Aggregator - Aptos

Implements the base abstractions for the Aptos blockchain.

### Usage

```ts
import { AptosWallet } from "@wormhole-labs/wallet-aggregator-aptos";

const walletCore = AptosWallet.walletCoreFactory(aptosWalletConfig, true, []);
walletCore.wallets.forEach((wallet) => {
  new AptosWallet(wallet, walletCore);
});
```
