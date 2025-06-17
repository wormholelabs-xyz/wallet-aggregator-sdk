// WalletConnect Legacy is no longer supported in wagmi v2
// This file is kept for backward compatibility but won't work with wagmi v2

// Re-export types for backward compatibility
export type WalletConnectLegacyWalletConfig = Record<string, unknown>;
export class WalletConnectLegacyWallet {
  constructor(config: WalletConnectLegacyWalletConfig) {
    throw new Error(
      "WalletConnect Legacy is not supported in wagmi v2. Please use WalletConnect v2 instead."
    );
  }
}
