import { BaseFeatures } from "@wormhole-labs/wallet-aggregator-core";

/** PSBT (Partially Signed Bitcoin Transaction) data as a hex or base64 string. */
export type BtcPsbtTransaction = string;

export interface BtcNetworkInfo {
  network: "mainnet" | "testnet" | "signet" | "regtest";
}

export enum BtcWalletType {
  Xverse = "xverse",
  Unisat = "unisat",
  Phantom = "phantom",
  Leather = "leather",
  OKX = "okx",
}

export type BtcFeatures = BaseFeatures;

/** JSON-RPC 2.0 request(method, params) protocol — used by Xverse and Leather */
export interface BitcoinJsonRpcProvider {
  request(
    method: string,
    params?: Record<string, unknown>
  ): Promise<{ result?: any; error?: any }>;
}

declare global {
  interface Window {
    BitcoinProvider?: BitcoinJsonRpcProvider;
    unisat?: {
      requestAccounts(): Promise<string[]>;
      signPsbt(psbt: string): Promise<string>;
    };
    phantom?: {
      bitcoin?: {
        requestAccounts(): Promise<
          Array<{
            address: string;
            addressType: "p2tr" | "p2wpkh" | "p2sh" | "p2pkh";
            publicKey: string;
            purpose: "payment" | "ordinals";
          }>
        >;
        signPSBT(
          psbt: string,
          options?: {
            inputsToSign?: Array<{
              address: string;
              signingIndexes: number[];
              sigHash?: number;
            }>;
          }
        ): Promise<string>;
      };
    };
    LeatherProvider?: {
      request(
        method: string,
        params?: Record<string, unknown>
      ): Promise<{ result?: any; error?: any }>;
    };
    okxwallet?: {
      bitcoin?: {
        requestAccounts(): Promise<string[]>;
        signPsbt(
          psbtHex: string,
          options?: { autoFinalized?: boolean }
        ): Promise<string>;
      };
    };
  }
}
