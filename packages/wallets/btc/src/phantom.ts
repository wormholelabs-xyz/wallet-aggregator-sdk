import {
  NotSupported,
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
    // Phantom's Bitcoin provider can sign PSBTs but exposes no broadcast API,
    // so it cannot sign-and-send. Callers must broadcast separately.
    return [];
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

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async signAndSendTransaction(
    _psbt: BtcPsbtTransaction
  ): Promise<SendTransactionResult<string>> {
    // Phantom's Bitcoin provider only signs PSBTs; it has no broadcast API.
    // Returning the signed PSBT here would be a footgun — callers expect a
    // real txid. Broadcast the signed PSBT through a separate path instead.
    throw new NotSupported();
  }
}
