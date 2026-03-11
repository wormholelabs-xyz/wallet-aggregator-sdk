import {
  BaseFeatures,
  WalletState,
} from "@wormhole-labs/wallet-aggregator-core";
import type { SendTransactionResult } from "@wormhole-labs/wallet-aggregator-core";
import { BtcWallet } from "./btc";
import { XVERSE_ICON } from "./icons";
import type {
  BtcFeatures,
  BtcPsbtTransaction,
  BitcoinJsonRpcProvider,
} from "./types";
import { BtcWalletType } from "./types";

function getProvider(): BitcoinJsonRpcProvider | undefined {
  if (
    typeof window !== "undefined" &&
    window.BitcoinProvider &&
    "request" in window.BitcoinProvider
  ) {
    return window.BitcoinProvider as BitcoinJsonRpcProvider;
  }
}

export class XverseBtc extends BtcWallet {
  getName(): string {
    return "Xverse";
  }

  getUrl(): string {
    return "https://www.xverse.app/";
  }

  getIcon(): string {
    return XVERSE_ICON;
  }

  getWalletState(): WalletState {
    return getProvider() ? WalletState.Installed : WalletState.NotDetected;
  }

  getFeatures(): BtcFeatures[] {
    return [BaseFeatures.SignAndSendTransaction];
  }

  static getWalletType(): BtcWalletType {
    return BtcWalletType.Xverse;
  }

  protected async innerConnect(): Promise<string> {
    const provider = getProvider();
    if (!provider) {
      throw new Error("Xverse wallet not detected");
    }

    const response = await provider.request("getAccounts", {
      purposes: ["payment", "ordinals"],
    });

    // Xverse returns JSON-RPC 2.0: { jsonrpc, id, result: AccountInfo[] }
    const result = (response as any).result ?? response;
    const accountList: Array<{ address: string }> = Array.isArray(result)
      ? result
      : Array.isArray(result?.addresses)
      ? result.addresses
      : [];

    if (!accountList.length) {
      throw new Error(
        `Xverse did not return any accounts. Response: ${JSON.stringify(
          response
        )}`
      );
    }

    return accountList[0].address;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async innerDisconnect(): Promise<void> {
    // Xverse has no explicit disconnect API
  }

  async signAndSendTransaction(
    psbt: BtcPsbtTransaction
  ): Promise<SendTransactionResult<string>> {
    const provider = getProvider();
    if (!provider) {
      throw new Error("Xverse wallet not detected");
    }

    const response = await provider.request("signPsbt", {
      psbt,
      broadcast: true,
    });

    const rpc = response as any;
    if (rpc.error) {
      throw new Error(`Xverse signPsbt failed: ${JSON.stringify(rpc.error)}`);
    }

    const result = rpc.result ?? response.result;
    const id: string = result?.txid ?? result?.psbt ?? result;

    return { id };
  }
}
