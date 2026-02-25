import {
  Address,
  CHAIN_ID_XRPL,
  ChainId,
  NotSupported,
  SendTransactionResult,
  Wallet,
  WalletState,
} from "@wormhole-labs/wallet-aggregator-core";
import {
  XrplFeatures,
  XrplNetworkInfo,
  XrplTransaction,
  XrplWalletType,
} from "./types";

export abstract class XrplWallet extends Wallet<
  typeof CHAIN_ID_XRPL,
  void,
  XrplTransaction,
  string,
  string,
  string,
  XrplTransaction,
  string,
  string,
  string,
  XrplNetworkInfo,
  XrplFeatures
> {
  protected address: Address | undefined;
  protected networkInfo: XrplNetworkInfo | undefined;

  protected abstract innerConnect(): Promise<Address>;
  protected abstract innerDisconnect(): Promise<void>;

  abstract signTransaction(tx: XrplTransaction): Promise<string>;
  abstract signAndSendTransaction(
    tx: XrplTransaction
  ): Promise<SendTransactionResult<string>>;
  abstract signMessage(msg: string): Promise<string>;

  abstract getWalletState(): WalletState;
  abstract getFeatures(): XrplFeatures[];
  static getWalletType(): XrplWalletType {
    throw new Error("Must be implemented by subclass");
  }

  getChainId() {
    return CHAIN_ID_XRPL;
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId === CHAIN_ID_XRPL;
  }

  getAddress(): Address | undefined {
    return this.address;
  }

  getAddresses(): Address[] {
    return this.address ? [this.address] : [];
  }

  setMainAddress(address: Address): void {
    if (this.address !== address) {
      throw new Error("Unknown address");
    }
  }

  isConnected(): boolean {
    return !!this.address;
  }

  getNetworkInfo(): XrplNetworkInfo | undefined {
    return this.networkInfo;
  }

  async connect(): Promise<Address[]> {
    this.address = await this.innerConnect();
    this.emit("connect");
    return this.getAddresses();
  }

  async disconnect(): Promise<void> {
    await this.innerDisconnect();
    this.address = undefined;
    this.networkInfo = undefined;
    this.emit("disconnect");
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async sendTransaction(_blob: string): Promise<SendTransactionResult<string>> {
    throw new NotSupported();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getBalance(): Promise<string> {
    throw new NotSupported();
  }
}
