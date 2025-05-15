import {
  Action,
  FinalExecutionOutcome,
  Network,
  Wallet as InternalWallet,
} from "@near-wallet-selector/core";
import {
  ChainId,
  CHAIN_ID_NEAR,
  NotSupported,
  SendTransactionResult,
  Wallet,
  BaseFeatures,
} from "@wormhole-labs/wallet-aggregator-core";

export interface NearTransaction {
  signerId?: string;
  receiverId: string;
  actions: Action[];
}

export interface NearTransactionParams {
  transactions: NearTransaction[];
}

export type NearTransactionResult = FinalExecutionOutcome[];

export abstract class NearWallet extends Wallet<
  typeof CHAIN_ID_NEAR,
  void,
  NearTransactionParams,
  NearTransactionParams,
  NearTransactionParams,
  NearTransactionResult,
  NearTransactionParams,
  NearTransactionResult,
  never,
  never,
  Network
> {
  abstract signTransaction(
    tx: NearTransactionParams
  ): Promise<NearTransactionParams>;

  abstract sendTransaction(
    txs: NearTransactionParams
  ): Promise<SendTransactionResult<NearTransactionResult>>;

  async signAndSendTransaction(
    tx: NearTransactionParams
  ): Promise<SendTransactionResult<NearTransactionResult>> {
    const signed = await this.signTransaction(tx);
    return this.sendTransaction(signed);
  }

  signMessage(): Promise<never> {
    throw new NotSupported();
  }

  /**
   * Returns the underlying wallet instance, if any
   */
  abstract getWallet(): Promise<InternalWallet | undefined>;

  getChainId() {
    return CHAIN_ID_NEAR;
  }

  getFeatures(): BaseFeatures[] {
    return [
      BaseFeatures.SignTransaction,
      BaseFeatures.SendTransaction,
      BaseFeatures.SignAndSendTransaction,
    ];
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId === CHAIN_ID_NEAR;
  }
}
