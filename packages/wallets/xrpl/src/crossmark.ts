import {
  BaseFeatures,
  NotSupported,
  WalletState,
} from "@wormhole-labs/wallet-aggregator-core";
import type { SendTransactionResult } from "@wormhole-labs/wallet-aggregator-core";
import sdk from "@crossmarkio/sdk";
import { XrplWallet } from "./xrpl";
import {
  CrossmarkNetwork,
  XrplFeatures,
  XrplNetworkInfo,
  XrplTransaction,
  XrplWalletType,
} from "./types";

export class CrossmarkXrpl extends XrplWallet {
  private fetchNetworkInfo(): XrplNetworkInfo | undefined {
    const network = sdk.sync.getNetwork() as CrossmarkNetwork;
    if (!network) return undefined;
    return {
      chain: network.type,
      network: network.label,
      websocket: network.wss,
    };
  }

  getName(): string {
    return "Crossmark";
  }

  getUrl(): string {
    return "https://crossmark.io/";
  }

  getIcon(): string {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSIjMUExQTFBIi8+PHBhdGggZD0iTTkgOWwxNCAxNG0wLTE0TDkgMjMiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=";
  }

  protected async innerConnect(): Promise<string> {
    const detected = await sdk.async.detect();
    if (!detected) {
      throw new Error("Crossmark is not installed");
    }

    const { response } = await sdk.methods.signInAndWait();
    const address = response.data.address;
    if (!address) {
      throw new Error("Failed to get address from Crossmark");
    }

    this.networkInfo = this.fetchNetworkInfo();

    sdk.on("network-change", () => {
      this.networkInfo = this.fetchNetworkInfo();
      this.emit("networkChanged");
    });

    sdk.on("user-change", () => {
      const address = sdk.sync.getAddress();
      if (address) {
        this.address = address;
      }
    });

    return address;
  }

  protected innerDisconnect(): Promise<void> {
    // Crossmark has no explicit disconnect API
    return Promise.resolve();
  }

  async signTransaction(tx: XrplTransaction): Promise<string> {
    const { response } = await sdk.methods.signAndWait(tx);
    return response.data.txBlob;
  }

  async sendTransaction(blob: string): Promise<SendTransactionResult<string>> {
    if (!this.address) throw new Error("Not connected");
    const { response } = await sdk.methods.submitAndWait(this.address, blob);
    return { id: response.data.resp.result.hash };
  }

  async signAndSendTransaction(
    tx: XrplTransaction
  ): Promise<SendTransactionResult<string>> {
    const { response } = await sdk.methods.signAndSubmitAndWait(tx);
    return { id: response.data.resp.result.hash };
  }

  signMessage(): Promise<string> {
    throw new NotSupported();
  }

  getWalletState(): WalletState {
    if (typeof window !== "undefined" && window.xrpl?.isCrossmark) {
      return WalletState.Installed;
    }
    return WalletState.NotDetected;
  }

  getFeatures(): XrplFeatures[] {
    return [
      BaseFeatures.SignTransaction,
      BaseFeatures.SendTransaction,
      BaseFeatures.SignAndSendTransaction,
    ];
  }

  static getWalletType(): XrplWalletType {
    return XrplWalletType.Crossmark;
  }
}
