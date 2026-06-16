import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64 } from "@mysten/sui/utils";
import {
  StandardConnectMethod,
  StandardDisconnectMethod,
  Wallet as StandardWallet,
  SignedTransaction,
  SuiSignAndExecuteTransactionMethod,
  SuiSignAndExecuteTransactionOutput,
  SuiSignMessageInput,
  SuiSignMessageMethod,
  SuiSignMessageOutput,
  SuiSignTransactionMethod,
  WalletAccount,
} from "@mysten/wallet-standard";
import {
  BaseFeatures,
  CHAIN_ID_SUI,
  ChainId,
  NotConnected,
  NotSupported,
  SendTransactionResult,
  Wallet,
} from "@wormhole-labs/wallet-aggregator-core";
import { DEFAULTS, SuiWalletName, WalletInfo } from "./walletsInfo";

export enum FeatureName {
  STANDARD__CONNECT = "standard:connect",
  STANDARD__DISCONNECT = "standard:disconnect",
  STANDARD__EVENTS = "standard:events",
  SUI__SIGN_AND_EXECUTE_TRANSACTION = "sui:signAndExecuteTransaction",
  SUI__SIGN_TRANSACTION = "sui:signTransaction",
  SUI__SIGN_MESSAGE = "sui:signMessage",
}

interface SignAndSendTransactionOptions {
  transaction: Transaction;
}

type ConnectFeature = { connect: StandardConnectMethod };
type DisconnectFeature = { disconnect: StandardDisconnectMethod };
type SignAndExecuteTransactionFeature = {
  signAndExecuteTransaction: SuiSignAndExecuteTransactionMethod;
};
type SignTransactionFeature = {
  signTransaction: SuiSignTransactionMethod;
};
type SignMessageFeature = { signMessage: SuiSignMessageMethod };
type SuiNetworkInfo = {
  chain: string;
};

const DO_NOT_REMOVE_WALLET_FROM = ["OKX", "Bitget"] as const;

export class SuiWallet extends Wallet<
  typeof CHAIN_ID_SUI,
  void,
  Transaction,
  SignedTransaction,
  SignedTransaction,
  SuiSignAndExecuteTransactionOutput,
  SignAndSendTransactionOptions,
  SuiSignAndExecuteTransactionOutput,
  SuiSignMessageInput,
  SuiSignMessageOutput,
  SuiNetworkInfo,
  BaseFeatures
> {
  private readonly _name;
  private accounts: WalletAccount[] = [];
  private activeAccount?: WalletAccount;

  constructor(
    private readonly wallet: StandardWallet,
    // v2 Sui gRPC client, used to submit a separately-signed transaction
    // (sendTransaction). Optional: wallets using signAndSendTransaction
    // submit via the wallet itself and don't need it.
    private readonly client?: SuiGrpcClient
  ) {
    super();
    if (DO_NOT_REMOVE_WALLET_FROM.find((name) => wallet.name.includes(name))) {
      this._name = wallet.name;
    } else {
      this._name = wallet.name.replace("Wallet", "").trim();
    }
  }

  async connect(): Promise<string[]> {
    const { connect } = this.getFeature<ConnectFeature>(
      FeatureName.STANDARD__CONNECT
    );

    const { accounts } = await connect();

    this.accounts = [...accounts];
    this.activeAccount = accounts[0];
    this.emit("connect");

    return this.accounts.map((a) => a.address);
  }

  async disconnect(): Promise<void> {
    const { disconnect } =
      this.getFeature<DisconnectFeature | undefined>(
        FeatureName.STANDARD__DISCONNECT,
        false
      ) || {};

    if (disconnect) {
      await disconnect();
    }

    this.accounts = [];

    this.emit("disconnect");
  }

  signTransaction(transaction: Transaction): Promise<SignedTransaction> {
    if (!this.activeAccount) throw new NotConnected();

    const { signTransaction } = this.getFeature<SignTransactionFeature>(
      FeatureName.SUI__SIGN_TRANSACTION
    );

    return signTransaction({
      transaction,
      account: this.activeAccount,
      chain: this.activeAccount.chains[0],
    });
  }

  async sendTransaction(
    tx: SignedTransaction
  ): Promise<SendTransactionResult<SuiSignAndExecuteTransactionOutput>> {
    if (!this.client) throw new Error("Sui client not provided");

    const result = await this.client.executeTransaction({
      transaction: fromBase64(tx.bytes),
      signatures: [tx.signature],
    });

    const executed = result.Transaction ?? result.FailedTransaction;

    return {
      id: executed!.digest,
      data: result as unknown as SuiSignAndExecuteTransactionOutput,
    };
  }

  async signAndSendTransaction(
    options: SignAndSendTransactionOptions
  ): Promise<SendTransactionResult<SuiSignAndExecuteTransactionOutput>> {
    if (!this.activeAccount) throw new NotConnected();

    const { signAndExecuteTransaction } =
      this.getFeature<SignAndExecuteTransactionFeature>(
        FeatureName.SUI__SIGN_AND_EXECUTE_TRANSACTION
      );

    const result = await signAndExecuteTransaction({
      transaction: options.transaction,
      account: this.activeAccount,
      chain: this.activeAccount.chains[0],
    });

    return {
      id: result.digest,
      data: result,
    };
  }

  getName(): string {
    return this._name;
  }

  getUrl(): string {
    const info = WalletInfo[this.wallet.name as SuiWalletName];
    return info?.url || DEFAULTS.url;
  }

  getChainId() {
    return CHAIN_ID_SUI;
  }

  getAddress(): string | undefined {
    return this.activeAccount?.address;
  }

  getAddresses(): string[] {
    return this.accounts.map((a) => a.address);
  }

  setMainAddress(address: string): void {
    const account = this.accounts.find((a) => a.address === address);
    if (!account) throw new Error("Account not found");
    this.activeAccount = account;
  }

  getBalance(): Promise<string> {
    throw new Error("Method not implemented.");
  }

  signMessage(msg: SuiSignMessageInput): Promise<SuiSignMessageOutput> {
    const { signMessage } = this.getFeature<SignMessageFeature>(
      FeatureName.SUI__SIGN_MESSAGE
    );

    return signMessage(msg);
  }

  getIcon(): string {
    const info = WalletInfo[this.wallet.name as SuiWalletName];
    return info?.icon || DEFAULTS.icon;
  }

  isConnected(): boolean {
    return this.accounts.length > 0;
  }

  getNetworkInfo(): SuiNetworkInfo | undefined {
    return this.activeAccount
      ? { chain: this.activeAccount.chains[0] }
      : undefined;
  }

  private getFeature<T>(name: FeatureName, mustSupport = true): T {
    const feature = this.wallet.features[name];
    if (!feature && mustSupport) throw new NotSupported();
    return feature as T;
  }

  getFeatures(): BaseFeatures[] {
    const features = [BaseFeatures.SendTransaction];
    if (this.wallet.features[FeatureName.SUI__SIGN_TRANSACTION]) {
      features.push(BaseFeatures.SignTransaction);
    }
    if (this.wallet.features[FeatureName.SUI__SIGN_AND_EXECUTE_TRANSACTION]) {
      features.push(BaseFeatures.SignAndSendTransaction);
    }
    if (this.wallet.features[FeatureName.SUI__SIGN_MESSAGE]) {
      features.push(BaseFeatures.SignMessage);
    }
    return features;
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId === CHAIN_ID_SUI;
  }
}
