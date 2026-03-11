import {
  BaseFeatures,
  WalletState,
} from "@wormhole-labs/wallet-aggregator-core";
import type { SendTransactionResult } from "@wormhole-labs/wallet-aggregator-core";
import { BtcWallet } from "./btc";
import { PHANTOM_ICON } from "./icons";
import type { BtcFeatures, BtcPsbtTransaction } from "./types";
import { BtcWalletType } from "./types";

export class PhantomBtc extends BtcWallet {
  getName(): string {
    return "Phantom";
  }

  getUrl(): string {
    return "https://phantom.com";
  }

  getIcon(): string {
    return PHANTOM_ICON;
  }

  getWalletState(): WalletState {
    return typeof window !== "undefined" && window.phantom?.bitcoin
      ? WalletState.Installed
      : WalletState.NotDetected;
  }

  getFeatures(): BtcFeatures[] {
    return [BaseFeatures.SignAndSendTransaction];
  }

  static getWalletType(): BtcWalletType {
    return BtcWalletType.Phantom;
  }

  protected async innerConnect(): Promise<string> {
    if (typeof window === "undefined" || !window.phantom?.bitcoin) {
      throw new Error("Phantom wallet not detected");
    }

    const accounts = await window.phantom.bitcoin.requestAccounts();

    // Defensively handle JSON-RPC 2.0 response shape ({ result: [...] })
    const accountList: Array<{ address: string }> = Array.isArray(accounts)
      ? accounts
      : Array.isArray((accounts as any)?.result)
      ? (accounts as any).result
      : [];

    if (!accountList.length) {
      throw new Error(
        `Phantom did not return any accounts. Response: ${JSON.stringify(
          accounts
        )}`
      );
    }

    return accountList[0].address;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async innerDisconnect(): Promise<void> {
    // Phantom has no explicit disconnect API for Bitcoin
  }

  async signAndSendTransaction(
    psbt: BtcPsbtTransaction
  ): Promise<SendTransactionResult<string>> {
    if (typeof window === "undefined" || !window.phantom?.bitcoin) {
      throw new Error("Phantom wallet not detected");
    }

    const response = await window.phantom.bitcoin.signPSBT(psbt);

    // Defensively handle JSON-RPC 2.0 response shape ({ result: ... })
    const rpc = response as any;
    if (rpc?.error) {
      throw new Error(`Phantom signPSBT failed: ${JSON.stringify(rpc.error)}`);
    }

    const result = rpc?.result ?? response;
    const id: string = result?.txid ?? result?.psbt ?? result;

    return { id };
  }
}
