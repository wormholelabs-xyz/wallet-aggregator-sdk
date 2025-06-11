import { walletConnect } from "@wagmi/connectors";
import { EVMWalletConfig, EVMWalletType } from "./evm";
import { BaseWalletConnectWallet } from "./walletConnectBase";

// WalletConnect v2 options
type WalletConnectOptions = Parameters<typeof walletConnect>[0];

export type WalletConnectWalletConfig = EVMWalletConfig<WalletConnectOptions>;

export class WalletConnectWallet extends BaseWalletConnectWallet<WalletConnectOptions> {
  constructor(config: WalletConnectWalletConfig = {}) {
    super(config);
  }

  protected createConnectorFn(): any {
    return walletConnect(this.connectorOptions);
  }
}
