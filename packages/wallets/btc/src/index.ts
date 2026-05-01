export * from "./btc";
export * from "./xverse";
export * from "./unisat";
export * from "./phantom";
export * from "./leather";
export * from "./okx";
export { assertTxid, isValidTxid } from "./txid";

export type {
  BtcPsbtTransaction,
  BtcNetworkInfo,
  BtcFeatures,
  BitcoinJsonRpcProvider,
} from "./types";
export { BtcWalletType } from "./types";

import { BtcWallet } from "./btc";
import { XverseBtc } from "./xverse";
import { UnisatBtc } from "./unisat";
import { LeatherBtc } from "./leather";
import { OKXBtc } from "./okx";

export const getSupportedWallets = (): BtcWallet[] => {
  return [new XverseBtc(), new UnisatBtc(), new LeatherBtc(), new OKXBtc()];
};
