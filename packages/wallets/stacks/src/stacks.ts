import {
  request,
  disconnect,
  getLocalStorage,
  getSelectedProviderId,
  setSelectedProviderId,
  isConnected,
} from "@stacks/connect";
import type { MethodResult, WbipProvider } from "@stacks/connect";
import { getProviderFromId } from "@stacks/connect-ui";
import { ContractCallOptions } from "@stacks/transactions";
import { with0x } from "@stacks/common";
import { ClarityValue } from "@stacks/connect/dist/types/methods";
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

export class StacksWallet extends Wallet<
  typeof CHAIN_ID_STACKS,
  void,
  string,
  MethodResult<"stx_signTransaction">,
  never,
  never,
  ContractCallOptions,
  MethodResult<"stx_callContract">,
  string,
  MethodResult<"stx_signMessage">,
  StacksWalletConfig["network"]
> {
  private provider: WbipProvider;
  private network: StacksWalletConfig["network"];
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
    return this.network;
  }

  async connect(): Promise<string[]> {
    // Check if the wallet was previously connected.
    // Read addresses from local storage without prompting the user.
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

  async signTransaction(
    transaction: string
  ): Promise<MethodResult<"stx_signTransaction">> {
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
    // @stacks/connect's `request` function does not provide a way to send a signed transaction
    // Use the Stacks node RPC API to broadcast the signed transaction
    throw new NotSupported();
  }

  private formatFunctionArgs(args: ContractCallOptions["functionArgs"]) {
    if (!Array.isArray(args)) {
      return args;
    }

    if (args.every((arg) => typeof arg === "string")) {
      return args as string[];
    }

    return args as ClarityValue[];
  }

  private formatFee(fee: ContractCallOptions["fee"]) {
    if (typeof fee === "string" || typeof fee === "number") {
      return fee;
    }

    if (fee instanceof Uint8Array) {
      return BigInt("0x" + Buffer.from(fee).toString("hex")).toString();
    }

    return undefined;
  }

  private formatPostConditionMode(
    mode: ContractCallOptions["postConditionMode"]
  ) {
    if (!mode) {
      return undefined;
    }

    if (mode === 1) {
      return "allow";
    }

    return "deny";
  }

  async signAndSendTransaction(
    options: ContractCallOptions
  ): Promise<SendTransactionResult<MethodResult<"stx_callContract">>> {
    if (!this.isConnected()) {
      throw new NotConnected();
    }

    if (options.network && options.network !== this.network) {
      throw new Error(
        `Transaction network (${options.network}) does not match wallet network (${this.network})`
      );
    }

    const result = await request(
      {
        provider: this.walletProvider,
      },
      "stx_callContract",
      {
        contract: `${options.contractAddress}.${options.contractName}`,
        functionName: options.functionName,
        functionArgs: this.formatFunctionArgs(options.functionArgs),
        network: this.network,
        address: this.address,
        fee: this.formatFee(options.fee),
        postConditionMode: this.formatPostConditionMode(
          options.postConditionMode
        ),
      }
    );

    // Ensure txId has 0x prefix to match format returned
    // by Stacks node RPC API and Hiro Stacks API
    const txId = with0x(result.txid || "");

    return {
      id: txId,
      data: result,
    };
  }

  async signMessage(message: string): Promise<MethodResult<"stx_signMessage">> {
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

    return result;
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
