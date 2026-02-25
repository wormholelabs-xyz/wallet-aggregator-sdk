export * from "./xrpl";
export * from "./gemwallet";
export * from "./crossmark";

export type { XrplTransaction, XrplNetworkInfo, XrplFeatures } from "./types";
export { XrplWalletType } from "./types";

import { XrplWallet } from "./xrpl";
import { GemWalletXrpl } from "./gemwallet";
import { CrossmarkXrpl } from "./crossmark";

export const getSupportedWallets = (): XrplWallet[] => {
  return [new GemWalletXrpl(), new CrossmarkXrpl()];
};
