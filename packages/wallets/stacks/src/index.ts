import { DEFAULT_PROVIDERS } from "@stacks/connect";
import type { WbipProvider } from "@stacks/connect";
import { StacksWallet, StacksWalletConfig } from "./stacks";

export type GetWalletsOptions = Omit<StacksWalletConfig, "provider">;

export * from "./stacks";

// TODO: wallet connect support
export const getSupportedWallets = (
  config: GetWalletsOptions
): StacksWallet[] => {
  return DEFAULT_PROVIDERS.map(
    (provider: WbipProvider) => new StacksWallet({ ...config, provider })
  );
};
