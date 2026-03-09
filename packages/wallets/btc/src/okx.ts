import {
  BaseFeatures,
  WalletState,
} from "@wormhole-labs/wallet-aggregator-core";
import type { SendTransactionResult } from "@wormhole-labs/wallet-aggregator-core";
import { BtcWallet } from "./btc";
import { OKX_ICON } from "./icons";
import type { BtcFeatures, BtcPsbtTransaction } from "./types";
import { BtcWalletType } from "./types";

function getProvider() {
  return typeof window !== "undefined" ? window.okxwallet?.bitcoin : undefined;
}

export class OKXBtc extends BtcWallet {
  getName(): string {
    return "OKX";
  }

  getUrl(): string {
    return "https://www.okx.com/web3";
  }

  getIcon(): string {
    return OKX_ICON;
  }

  getWalletState(): WalletState {
    return getProvider() ? WalletState.Installed : WalletState.NotDetected;
  }

  getFeatures(): BtcFeatures[] {
    return [BaseFeatures.SignAndSendTransaction];
  }

  static getWalletType(): BtcWalletType {
    return BtcWalletType.OKX;
  }

  protected async innerConnect(): Promise<string> {
    const provider = getProvider();
    if (!provider) {
      throw new Error("OKX wallet not detected");
    }

    const accounts: string[] = await provider.requestAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error("OKX wallet did not return any accounts");
    }

    return accounts[0];
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async innerDisconnect(): Promise<void> {
    // OKX has no explicit disconnect API for Bitcoin
  }

  async signAndSendTransaction(
    psbt: BtcPsbtTransaction
  ): Promise<SendTransactionResult<string>> {
    const provider = getProvider();
    if (!provider) {
      throw new Error("OKX wallet not detected");
    }

    const txid = await provider.signPsbt(psbt, { autoFinalized: true });
    return { id: txid };
  }
}
