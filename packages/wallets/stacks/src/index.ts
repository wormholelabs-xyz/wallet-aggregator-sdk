import { DEFAULT_PROVIDERS, type WbipProvider } from "@stacks/connect";
import { StacksWallet, type StacksWalletConfig } from "./stacks";

export type GetWalletsOptions = Omit<StacksWalletConfig, "provider">;

export * from "./stacks";

export const getSupportedWallets = (
  config: GetWalletsOptions
): StacksWallet[] => {
  return DEFAULT_PROVIDERS.map(
    (provider: WbipProvider) => new StacksWallet({ ...config, provider })
  );
};
