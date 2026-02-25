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
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxIDEpIHNjYWxlKDAuNzUpIiBmaWxsPSJub25lIj48cGF0aCBmaWxsPSIjMDBBOEVBIiBkPSJNMjAgMzkuOTExLjU5MyAxNy40MjJoMzguODE0eiIvPjxwYXRoIGZpbGw9IiMzM0QzRjQiIGQ9Ik0zMy4xODUgNS4zMzNINi44MTVMLjU5MyAxNy40MjNoMzguODE0eiIvPjxwYXRoIGZpbGw9IiM0MEVFRkYiIGQ9Im0yMCAzOS45MTEtNy4wMzctMjIuNDg5aDE0LjA3NHpNMTQuMjIyIDE0LjQgOC42NjcgNS4zMzNIMjB6bTExLjI1OSAwTDIwIDUuMzMzaDExLjMzM3oiLz48cGF0aCBmaWxsPSIjRkZGIiBkPSJNNi4yOTYgNi40ODkgMy40MDcgNS4zMzNsMi44OS0xLjE1NUw3LjI1OC43MWwuOTYzIDMuNDY3IDIuODkgMS4xNTUtMi44OSAxLjE1Ni0uOTYzIDMuNDY3em0yNy40MDggMTEuMjg5LTEuODUyLS43MTEgMS44NTItLjguNjY2LTIuMjIzLjU5MyAyLjIyMyAxLjg1Mi44LTEuODUyLjcxTDM0LjM3IDIweiIvPjxwYXRoIGQ9Ik0yMS44NTIgNS4zMzMgNi4yOTYgMjQuMDlsLTEuMzMzLTEuNTExIDE0LjM3LTE3LjI0NXptOC43NDEgMEwxMC43NCAyOS4xNTYgNy42MyAyNS42IDI0LjQ0NCA1LjMzM3oiIG9wYWNpdHk9Ii4yIiBmaWxsPSIjRkZGIi8+PC9nPjwvc3ZnPg==";
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
