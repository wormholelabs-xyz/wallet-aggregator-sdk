import {
  request,
  disconnect,
  getLocalStorage,
  getSelectedProviderId,
  setSelectedProviderId,
  isConnected,
} from "@stacks/connect";
import type { ContractCallPayload, WbipProvider } from "@stacks/connect";
import { getProviderFromId } from "@stacks/connect-ui";
import {
  BaseFeatures,
  CHAIN_ID_STACKS,
  NotSupported,
  NotConnected,
  SendTransactionResult,
  Wallet,
  WalletState,
} from "@wormhole-labs/wallet-aggregator-core";

export interface StacksWalletConfig {
  provider: WbipProvider;
  network: "mainnet" | "testnet";
}

export type StacksContractCallInput = ContractCallPayload;

export interface StacksTransactionResult {
  txId: string;
  txRaw?: string;
}

export class StacksWallet extends Wallet {
  private provider: WbipProvider;
  private network: "mainnet" | "testnet";
  private walletProvider: any; // implementation-specific wallet provider
  private address?: string;

  constructor(config: StacksWalletConfig) {
    super();
    this.provider = config.provider;
    this.network = config.network;
    this.walletProvider = getProviderFromId(this.provider.id);
  }

  getName(): string {
    return this.provider.name;
  }

  getUrl(): string {
    return this.provider.webUrl || "";
  }

  getIcon(): string {
    return this.provider.icon || "";
  }

  getChainId() {
    return CHAIN_ID_STACKS;
  }

  getAddresses(): string[] {
    const storage = getLocalStorage();
    const stacksAddresses = storage?.addresses.stx || [];
    return stacksAddresses.map((addr) => addr.address);
  }

  getAddress(): string | undefined {
    return this.address;
  }

  setMainAddress(): void {
    throw new NotSupported();
  }

  async getBalance(): Promise<string> {
    throw new NotSupported();
  }

  isConnected(): boolean {
    return !!this.address;
  }

  getNetworkInfo() {
    return {
      network: this.network,
    };
  }

  async connect(): Promise<string[]> {
    // Check if the wallet was previously connected.
    // Avoid calling `getAddresses`, since that prompts the user for approval.
    if (isConnected()) {
      const selectedProviderId = getSelectedProviderId();
      if (selectedProviderId === this.provider.id) {
        const addresses = this.getAddresses();
        if (addresses.length > 0) {
          this.address = addresses[0];
          return addresses;
        }
      }
    }

    // NOTE: Xverse Wallet throws when network is passed...
    const network =
      this.provider.name === "Xverse Wallet" ? undefined : this.network;

    try {
      await request(
        {
          provider: this.walletProvider,
        },
        "getAddresses",
        {
          network,
        }
      );

      const addresses = this.getAddresses();
      if (addresses.length === 0) {
        throw new Error("No addresses found");
      }
      this.address = addresses[0];

      setSelectedProviderId(this.provider.id);

      this.emit("connect");

      return addresses;
    } catch (error: any) {
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    disconnect();
    this.address = undefined;
    this.emit("disconnect");
  }

  async signTransaction(transaction: string) {
    if (!this.isConnected()) {
      throw new NotConnected();
    }

    const result = await request(
      {
        provider: this.walletProvider,
      },
      "stx_signTransaction",
      {
        transaction,
        broadcast: false,
      }
    );

    return result;
  }

  async sendTransaction(): Promise<never> {
    // TODO: @stacks/connect does not provide a way to send a signed transaction?
    throw new NotSupported();
  }

  async signAndSendTransaction(
    tx: StacksContractCallInput
  ): Promise<SendTransactionResult<StacksTransactionResult>> {
    if (!this.isConnected()) {
      throw new NotConnected();
    }

    const result = await request(
      {
        provider: this.walletProvider,
      },
      "stx_callContract",
      {
        contract: `${tx.contractAddress}.${tx.contractName}`,
        functionName: tx.functionName,
        functionArgs: tx.functionArgs,
        network: this.network,
        address: this.address,
        fee: tx.fee,
      }
    );

    return {
      id: result.txid || "",
      data: {
        txId: result.txid || "",
        txRaw: result.transaction,
      },
    };
  }

  async signMessage(message: string): Promise<string> {
    if (!this.isConnected()) {
      throw new NotConnected();
    }

    const result = await request(
      {
        provider: this.walletProvider,
      },
      "stx_signMessage",
      {
        message,
      }
    );

    return result.signature;
  }

  getWalletState(): WalletState {
    return this.walletProvider
      ? WalletState.Installed
      : WalletState.NotDetected;
  }

  getFeatures(): BaseFeatures[] {
    return [
      BaseFeatures.SignAndSendTransaction,
      BaseFeatures.SignTransaction,
      BaseFeatures.SignMessage,
    ];
  }

  supportsChain(chainId: number): boolean {
    return chainId === CHAIN_ID_STACKS;
  }
}
