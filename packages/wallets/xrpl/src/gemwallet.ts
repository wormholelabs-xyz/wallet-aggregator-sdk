import {
  BaseFeatures,
  NotSupported,
  WalletState,
} from "@wormhole-labs/wallet-aggregator-core";
import type { SendTransactionResult } from "@wormhole-labs/wallet-aggregator-core";
import {
  isInstalled,
  getAddress,
  getNetwork,
  signTransaction as gemSignTransaction,
  submitTransaction,
  signMessage as gemSignMessage,
  on,
} from "@gemwallet/api";
import { XrplWallet } from "./xrpl";
import { XrplFeatures, XrplTransaction, XrplWalletType } from "./types";

export class GemWalletXrpl extends XrplWallet {
  private _installed = false;

  getName(): string {
    return "GemWallet";
  }

  getUrl(): string {
    return "https://gemwallet.app/";
  }

  getIcon(): string {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI4IiBmaWxsPSIjMEQxMTE3Ii8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMSAxKSBzY2FsZSgwLjc1KSIgZmlsbD0ibm9uZSI+PHBhdGggZmlsbD0iIzAwQThFQSIgZD0iTTIwIDM5LjkxMS41OTMgMTcuNDIyaDM4LjgxNHoiLz48cGF0aCBmaWxsPSIjMzNEM0Y0IiBkPSJNMzMuMTg1IDUuMzMzSDYuODE1TC41OTMgMTcuNDIzaDM4LjgxNHoiLz48cGF0aCBmaWxsPSIjNDBFRUZGIiBkPSJtMjAgMzkuOTExLTcuMDM3LTIyLjQ4OWgxNC4wNzR6TTE0LjIyMiAxNC40IDguNjY3IDUuMzMzSDIwem0xMS4yNTkgMEwyMCA1LjMzM2gxMS4zMzN6Ii8+PHBhdGggZmlsbD0iI0ZGRiIgZD0iTTYuMjk2IDYuNDg5IDMuNDA3IDUuMzMzbDIuODktMS4xNTVMNy4yNTguNzFsLjk2MyAzLjQ2NyAyLjg5IDEuMTU1LTIuODkgMS4xNTYtLjk2MyAzLjQ2N3ptMjcuNDA4IDExLjI4OS0xLjg1Mi0uNzExIDEuODUyLS44LjY2Ni0yLjIyMy41OTMgMi4yMjMgMS44NTIuOC0xLjg1Mi43MUwzNC4zNyAyMHoiLz48cGF0aCBkPSJNMjEuODUyIDUuMzMzIDYuMjk2IDI0LjA5bC0xLjMzMy0xLjUxMSAxNC4zNy0xNy4yNDV6bTguNzQxIDBMMTAuNzQgMjkuMTU2IDcuNjMgMjUuNiAyNC40NDQgNS4zMzN6IiBvcGFjaXR5PSIuMiIgZmlsbD0iI0ZGRiIvPjwvZz48L3N2Zz4=";
  }

  protected async innerConnect(): Promise<string> {
    const installResponse = await isInstalled();
    if (!installResponse.result.isInstalled) {
      throw new Error("GemWallet is not installed");
    }
    this._installed = true;

    const addressResponse = await getAddress();
    if (addressResponse.type === "reject" || !addressResponse.result) {
      throw new Error("User rejected address request");
    }
    const address = addressResponse.result.address;

    const networkResponse = await getNetwork();
    if (networkResponse.type === "reject" || !networkResponse.result) {
      throw new Error("Failed to get network info");
    }
    this.networkInfo = {
      chain: networkResponse.result.chain,
      network: networkResponse.result.network,
      websocket: networkResponse.result.websocket,
    };

    on("networkChanged", async () => {
      try {
        const resp = await getNetwork();
        if (resp.type === "response" && resp.result) {
          this.networkInfo = {
            chain: resp.result.chain,
            network: resp.result.network,
            websocket: resp.result.websocket,
          };
          this.emit("networkChanged");
        }
      } catch {
        // ignore if the extension fails to respond
      }
    });

    on("walletChanged", async () => {
      try {
        const resp = await getAddress();
        if (resp.type === "response" && resp.result) {
          this.address = resp.result.address;
        }
      } catch {
        // ignore if the extension fails to respond
      }
    });

    return address;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async innerDisconnect(): Promise<void> {
    this._installed = false;
  }

  async signTransaction(tx: XrplTransaction): Promise<string> {
    const response = await gemSignTransaction({ transaction: tx });
    if (response.type === "reject" || !response.result?.signature) {
      throw new Error("User rejected transaction signing");
    }
    return response.result.signature;
  }

  sendTransaction(): Promise<SendTransactionResult<string>> {
    throw new NotSupported();
  }

  async signAndSendTransaction(
    tx: XrplTransaction
  ): Promise<SendTransactionResult<string>> {
    const response = await submitTransaction({ transaction: tx });
    if (response.type === "reject" || !response.result) {
      throw new Error("User rejected transaction submission");
    }
    return { id: response.result.hash };
  }

  async signMessage(msg: string): Promise<string> {
    const response = await gemSignMessage(msg);
    if (response.type === "reject" || !response.result) {
      throw new Error("User rejected message signing");
    }
    return response.result.signedMessage;
  }

  getWalletState(): WalletState {
    if (this._installed) return WalletState.Installed;
    return WalletState.Loadable;
  }

  getFeatures(): XrplFeatures[] {
    return [
      BaseFeatures.SignTransaction,
      BaseFeatures.SignAndSendTransaction,
      BaseFeatures.SignMessage,
    ];
  }

  static getWalletType(): XrplWalletType {
    return XrplWalletType.GemWallet;
  }
}
