import {
  Address,
  CHAIN_ID_BTC,
  ChainId,
  NotSupported,
  SendTransactionResult,
  Wallet,
  WalletState,
} from "@wormhole-labs/wallet-aggregator-core";
import {
  BtcFeatures,
  BtcNetworkInfo,
  BtcPsbtTransaction,
  BtcWalletType,
} from "./types";

export abstract class BtcWallet extends Wallet<
  typeof CHAIN_ID_BTC,
  void,
  BtcPsbtTransaction,
  string,
  string,
  string,
  BtcPsbtTransaction,
  string,
  string,
  string,
  BtcNetworkInfo,
  BtcFeatures
> {
  protected address: Address | undefined;
  protected networkInfo: BtcNetworkInfo | undefined;

  protected abstract innerConnect(): Promise<Address>;
  protected abstract innerDisconnect(): Promise<void>;

  abstract signAndSendTransaction(
    tx: BtcPsbtTransaction
  ): Promise<SendTransactionResult<string>>;

  abstract getWalletState(): WalletState;
  abstract getFeatures(): BtcFeatures[];
  static getWalletType(): BtcWalletType {
    throw new Error("Must be implemented by subclass");
  }

  getChainId() {
    return CHAIN_ID_BTC;
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId === CHAIN_ID_BTC;
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

  getNetworkInfo(): BtcNetworkInfo | undefined {
    return this.networkInfo;
  }

  async connect(): Promise<Address[]> {
    this.address = await this.innerConnect();
    this.networkInfo = { network: "mainnet" };
    this.emit("connect");
    return this.getAddresses();
  }

  async disconnect(): Promise<void> {
    await this.innerDisconnect();
    this.address = undefined;
    this.networkInfo = undefined;
    this.emit("disconnect");
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async signTransaction(_tx: BtcPsbtTransaction): Promise<string> {
    throw new NotSupported();
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async sendTransaction(_blob: string): Promise<SendTransactionResult<string>> {
    throw new NotSupported();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async signMessage(_msg: string): Promise<string> {
    throw new NotSupported();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getBalance(): Promise<string> {
    throw new NotSupported();
  }
}
