import {
  BaseFeatures,
  WalletState,
} from "@wormhole-labs/wallet-aggregator-core";
import type { SendTransactionResult } from "@wormhole-labs/wallet-aggregator-core";
import { BtcWallet } from "./btc";
import { UNISAT_ICON } from "./icons";
import type { BtcFeatures, BtcPsbtTransaction } from "./types";
import { BtcWalletType } from "./types";

export class UnisatBtc extends BtcWallet {
  getName(): string {
    return "Unisat";
  }

  getUrl(): string {
    return "https://unisat.io/";
  }

  getIcon(): string {
    return UNISAT_ICON;
  }

  getWalletState(): WalletState {
    return typeof window !== "undefined" && window.unisat
      ? WalletState.Installed
      : WalletState.NotDetected;
  }

  getFeatures(): BtcFeatures[] {
    return [BaseFeatures.SignAndSendTransaction];
  }

  static getWalletType(): BtcWalletType {
    return BtcWalletType.Unisat;
  }

  protected async innerConnect(): Promise<string> {
    if (typeof window === "undefined" || !window.unisat) {
      throw new Error("Unisat wallet not detected");
    }

    const accounts: string[] = await window.unisat.requestAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error("Unisat wallet did not return any accounts");
    }

    return accounts[0];
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async innerDisconnect(): Promise<void> {
    // Unisat has no explicit disconnect API
  }

  async signAndSendTransaction(
    psbt: BtcPsbtTransaction
  ): Promise<SendTransactionResult<string>> {
    if (typeof window === "undefined" || !window.unisat) {
      throw new Error("Unisat wallet not detected");
    }

    const txid: string = await window.unisat.signPsbt(psbt);
    return { id: txid };
  }
}
