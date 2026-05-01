import {
  BaseFeatures,
  WalletState,
} from "@wormhole-labs/wallet-aggregator-core";
import type { SendTransactionResult } from "@wormhole-labs/wallet-aggregator-core";
import { BtcWallet } from "./btc";
import { LEATHER_ICON } from "./icons";
import { assertTxid } from "./txid";
import type { BtcFeatures, BtcPsbtTransaction } from "./types";
import { BtcWalletType } from "./types";

function getProvider() {
  return typeof window !== "undefined" ? window.LeatherProvider : undefined;
}

export class LeatherBtc extends BtcWallet {
  getName(): string {
    return "Leather";
  }

  getUrl(): string {
    return "https://leather.io/";
  }

  getIcon(): string {
    return LEATHER_ICON;
  }

  getWalletState(): WalletState {
    return getProvider() ? WalletState.Installed : WalletState.NotDetected;
  }

  getFeatures(): BtcFeatures[] {
    return [BaseFeatures.SignAndSendTransaction];
  }

  static getWalletType(): BtcWalletType {
    return BtcWalletType.Leather;
  }

  protected async innerConnect(): Promise<string> {
    const provider = getProvider();
    if (!provider) {
      throw new Error("Leather wallet not detected");
    }

    const response = await provider.request("getAddresses", {
      types: ["p2wpkh", "p2tr"],
    });

    const addresses: Array<{ address: string; type: string }> =
      response?.result?.addresses ?? [];

    if (!addresses.length) {
      throw new Error(
        `Leather did not return any addresses. Response: ${JSON.stringify(
          response
        )}`
      );
    }

    // Prefer p2wpkh (payment) address; fall back to first available
    const payment = addresses.find((a) => a.type === "p2wpkh") ?? addresses[0];

    return payment.address;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async innerDisconnect(): Promise<void> {
    // Leather has no explicit disconnect API
  }

  async signAndSendTransaction(
    psbt: BtcPsbtTransaction
  ): Promise<SendTransactionResult<string>> {
    const provider = getProvider();
    if (!provider) {
      throw new Error("Leather wallet not detected");
    }

    const response = await provider.request("signPsbt", {
      hex: psbt,
      broadcast: true,
    });

    const rpc = response as any;
    if (rpc?.error) {
      throw new Error(`Leather signPsbt failed: ${JSON.stringify(rpc.error)}`);
    }

    const result = rpc?.result ?? response;
    const id = assertTxid(result?.txid, "Leather");

    return { id };
  }
}
