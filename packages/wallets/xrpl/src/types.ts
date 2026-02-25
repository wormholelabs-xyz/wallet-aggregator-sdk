import { BaseFeatures } from "@wormhole-labs/wallet-aggregator-core";

export type XrplTransaction = Record<string, unknown>;

export interface XrplNetworkInfo {
  chain: string;
  network: string;
  websocket: string;
}

export enum XrplWalletType {
  GemWallet = "gemwallet",
  Crossmark = "crossmark",
}

export interface CrossmarkNetwork {
  type: string;
  label: string;
  wss: string;
}

export type XrplFeatures = BaseFeatures;

declare global {
  interface Window {
    gemWallet?: boolean;
    xrpl?: {
      isCrossmark?: boolean;
    };
  }
}
