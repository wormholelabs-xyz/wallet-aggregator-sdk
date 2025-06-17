import {
  Config,
  Connector,
  CreateConnectorFn,
  createConfig,
  getPublicClient,
} from "@wagmi/core";
import { http, Transport } from "viem";
import {
  Address,
  BaseFeatures,
  CHAIN_ID_ETH,
  ChainId,
  NotConnected,
  NotSupported,
  SendTransactionResult,
  Signature,
  Wallet,
  WalletEvents,
  WalletState,
  isEVMChain,
} from "@wormhole-labs/wallet-aggregator-core";
import { ethers, TransactionReceipt, TransactionRequest } from "ethers";
import { Chain, DEFAULT_CHAINS } from "./chains";
import { evmChainIdToChainId, isTestnetEvm } from "./constants";
import { RpcError } from "viem";

type EVMChainId = number;

interface EVMWalletEvents extends WalletEvents {
  accountsChanged(address: Address[]): void;
}

// See:
// - https://github.com/MetaMask/eth-rpc-errors/blob/main/src/error-constants.ts
// - https://docs.metamask.io/guide/rpc-api.html#returns-7
enum ERROR_CODES {
  USER_REJECTED = 4001,
  CHAIN_NOT_ADDED = 4902,
}

/** @description EVMWallet config options */
export interface EVMWalletConfig<COpts = unknown> {
  /**
   * @description An array of evm chain config objects as defined by wagmi's Chain type.
   * While the information is the same as in the {@link https://eips.ethereum.org/EIPS/eip-3085 EIP-3085}, the structure is slightly different
   * Defaults to all chains
   */
  chains?: Chain[];
  /**
   * @description An EVM chain id. When connecting, the wallet will try to switch to this chain if the provider network's chain id differs.
   */
  preferredChain?: EVMChainId;
  /**
   * @description Indicates whether the wallet should attempt to switch the network back to the preferredChain upon detecting a `chainChanged` event.
   */
  autoSwitch?: boolean;
  /**
   * @description Amount of confirmations/blocks to wait a transaction for
   */
  confirmations?: number;
  /**
   * @description Options specific to the connection method
   */
  connectorOptions?: COpts;
}

export enum EVMWalletType {
  BitgetWallet = "bitgetwallet",
  // Binance = "binance",
  Coinbase = "coinbase",
  Injected = "injected",
  Ledger = "ledger",
  Metamask = "metamask",
  OKXWallet = "okxwallet",
  WalletConnect = "walletconnect",
}

export interface WatchAssetParams {
  type: string;
  options: {
    address: string;
    symbol: string;
    decimals?: number;
    image?: string;
    chainId?: number;
  };
}

export interface ConnectParams {
  chainId?: number;
}

export type EthereumMessage = string | Uint8Array;

export interface EVMNetworkInfo {
  /** @description Network EVM chain id */
  chainId: number;
}

class SwitchChainError extends Error {
  public readonly code: number;

  constructor(message: string, code: number, stack?: string) {
    super(message);
    this.code = code;
    this.stack = stack;
  }
}

/**
 * @description An abstraction over EVM compatible blockchain wallets
 */
export abstract class EVMWallet<COpts = unknown> extends Wallet<
  ChainId,
  ConnectParams,
  TransactionRequest,
  TransactionRequest,
  TransactionRequest,
  TransactionReceipt,
  TransactionRequest,
  TransactionReceipt,
  EthereumMessage,
  Signature,
  EVMNetworkInfo,
  BaseFeatures,
  EVMWalletEvents
> {
  protected chains: readonly [Chain, ...Chain[]];
  protected connector!: Connector;
  protected connectorFn: CreateConnectorFn;
  protected connectorOptions: COpts;
  protected network?: EVMNetworkInfo;
  protected config: EVMWalletConfig<COpts>;

  private addresses: Address[] = [];
  private address?: Address;
  private autoSwitch: boolean;
  private wagmiConfig?: Config;
  private provider?: ethers.BrowserProvider;
  private switchingChain = false;

  constructor(config: EVMWalletConfig<COpts> = {}) {
    super();
    const chains = config.chains || DEFAULT_CHAINS;
    if (chains.length === 0) {
      throw new Error("At least one chain must be provided");
    }
    this.chains = chains as unknown as readonly [Chain, ...Chain[]];
    this.autoSwitch = config.autoSwitch || false;
    this.connectorOptions = config.connectorOptions || ({} as COpts);
    this.config = config;

    // create here so that injected wallets can be detected before connecting
    this.connectorFn = this.createConnectorFn();
  }

  async connect({ chainId }: ConnectParams = {}): Promise<Address[]> {
    for (let chain of this.chains) {
      if (
        chain.rpcUrls.public === undefined &&
        chain.rpcUrls.default !== undefined
      ) {
        chain.rpcUrls.public = chain.rpcUrls.default;
      }
    }

    // Create transport configuration for each chain
    const transports: Record<number, Transport> = {};
    for (const chain of this.chains) {
      transports[chain.id] = http(chain.rpcUrls.default.http[0]);
    }

    this.wagmiConfig = createConfig({
      chains: this.chains,
      transports,
      connectors: [this.connectorFn],
    });

    // Get the actual connector instance from config
    this.connector = this.wagmiConfig.connectors[0];

    await this.connector.connect({
      chainId: chainId || this.config.preferredChain,
    });

    this.provider = new ethers.BrowserProvider(
      (await this.connector.getProvider()) as ethers.Eip1193Provider,
      "any"
    );

    this.connector.emitter.on("change", this.onChange.bind(this));
    this.connector.emitter.on("disconnect", this.onDisconnect.bind(this));

    this.network = await this.fetchNetworkInfo();
    const accounts = await this.connector.getAccounts();
    this.address = accounts[0];
    this.addresses = accounts as Address[];

    this.emit("connect");

    return this.addresses;
  }

  protected abstract createConnectorFn(): CreateConnectorFn;

  private async enforcePrefferedChain(): Promise<void> {
    if (!this.config.preferredChain) return;
    if (!this.connector.switchChain) throw new NotSupported();

    let currentChain = this.getNetworkInfo()?.chainId;
    while (currentChain !== this.config.preferredChain) {
      try {
        await this.connector.switchChain({
          chainId: this.config.preferredChain,
        });
        currentChain = this.getNetworkInfo()?.chainId;
      } catch (error) {
        const { code } = error as RpcError;
        // ignore user rejections
        if (code === ERROR_CODES.USER_REJECTED) {
          return;
        }
        throw error;
      }
    }
  }

  private async onChange(data: {
    accounts?: readonly Address[];
    chainId?: number;
  }) {
    if (data.chainId) await this.onChainChanged();
    if (data.accounts) await this.onAccountsChanged(data.accounts as Address[]);
  }

  /**
   * @description Change the preferred evm chain. Calling this method will automatically trigger a switch to the new chain request.
   *
   * @param chainId The new evm chain id
   */
  public async setPrefferedChain(chainId: EVMChainId): Promise<void> {
    this.config.preferredChain = chainId;
    await this.enforcePrefferedChain();
  }

  isConnected(): boolean {
    return !!this.provider;
  }

  async disconnect(): Promise<void> {
    await this.connector?.disconnect();
    await this.onDisconnect();
  }

  getChainId() {
    if (!this.isConnected() || !this.network) return CHAIN_ID_ETH;

    const evmChainId = this.network.chainId;

    const network = isTestnetEvm(evmChainId) ? "TESTNET" : "MAINNET";
    return evmChainIdToChainId(evmChainId, network);
  }

  getNetworkInfo(): EVMNetworkInfo | undefined {
    return this.network;
  }

  getAddress(): string | undefined {
    return this.address;
  }

  getAddresses(): string[] {
    return this.addresses;
  }

  setMainAddress(address: string): void {
    if (!this.addresses.includes(address)) throw new Error("Unknown address");
    this.address = address;
  }

  async signTransaction(tx: TransactionRequest): Promise<TransactionRequest> {
    if (!this.isConnected()) throw new NotConnected();
    await this.enforcePrefferedChain();
    return Promise.resolve(tx);
  }

  async sendTransaction(
    tx: TransactionRequest
  ): Promise<SendTransactionResult<TransactionReceipt>> {
    if (!this.isConnected()) throw new NotConnected();

    await this.enforcePrefferedChain();
    const signer = await this.getSigner();
    const response = await signer.sendTransaction(tx);
    const receipt = (await response.wait(this.config.confirmations))!;
    return {
      id: receipt?.hash,
      data: receipt,
    };
  }

  async signAndSendTransaction(
    tx: TransactionRequest
  ): Promise<SendTransactionResult<TransactionReceipt>> {
    return this.sendTransaction(tx);
  }

  async signMessage(msg: EthereumMessage): Promise<Signature> {
    if (!this.isConnected()) throw new NotConnected();
    await this.enforcePrefferedChain();
    const signer = await this.getSigner();
    const signature = await signer.signMessage(msg);
    return new Uint8Array(Buffer.from(signature.substring(2), "hex"));
  }

  /**
   * @description Try to switch the evm chain the wallet is connected to through the {@link https://eips.ethereum.org/EIPS/eip-3326 EIP-3326} `wallet_switchEthereumChain` method, or throw if the wallet does not support it.
   * Should the chain be missing from the provider, it will try to add it through the {@link https://eips.ethereum.org/EIPS/eip-3085 EIP-3085} `wallet_addEthereumChain` method, using the information stored in the map `chainParameters` injected through the constructor.
   * If a switch chain request is already in progress, it will ignore the new request and return without doing anything.
   *
   * @param ethChainId The EVM chain id of the chain to switch to
   */
  async switchChain(ethChainId: EVMChainId): Promise<void> {
    if (!this.isConnected()) throw new NotConnected();
    if (!this.connector?.switchChain) throw new NotSupported();

    // some wallets like metamask throw an error if the provider makes multiple requests
    // while others will trigger as many operations as are requested
    if (this.switchingChain) return;

    try {
      this.switchingChain = true;
      await this.connector.switchChain({ chainId: ethChainId });
      this.network = await this.fetchNetworkInfo();
    } catch (err) {
      const isChainNotAddedError =
        (err as RpcError).code === ERROR_CODES.CHAIN_NOT_ADDED;

      // wagmi only does this for injected wallets and not for walletconnect
      if (isChainNotAddedError) {
        await this.addChain(ethChainId);
        return;
      }

      throw err;
    } finally {
      this.switchingChain = false;
    }
  }

  /**
   * @description Try to add a new chain to the wallet through the {@link https://eips.ethereum.org/EIPS/eip-3085 EIP-3085} `wallet_addEthereumChain` method.
   * The chain information is looked up in the configured `chains` array.
   */
  public async addChain(ethChainId: EVMChainId): Promise<Chain> {
    if (!this.provider) throw new NotConnected();

    const chain = this.chains.find((chain) => chain.id === ethChainId);
    if (!chain) {
      throw new SwitchChainError(
        `Chain ${ethChainId} not configured`,
        ERROR_CODES.CHAIN_NOT_ADDED
      );
    }

    return (await this.provider.send("wallet_addEthereumChain", [
      {
        chainId: ethers.toBeHex(chain.id),
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: [chain.rpcUrls.public?.http[0] ?? ""],
        blockExplorerUrls: this.getBlockExplorerUrls(chain),
      },
    ])) as Chain;
  }

  /**
   * @description Try to add a new token to the wallet through the {@link https://eips.ethereum.org/EIPS/eip-747 EIP-747} `wallet_watchAsset` method.
   *
   * @param params The observed asset's information
   * @returns True if the request is recognized by the wallet, false otherwise. If the wallet does not support this method, it will always return false.
   */
  public async watchAsset(params: WatchAssetParams): Promise<boolean> {
    if (!this.provider) throw new NotConnected();
    // Check if connector has watchAsset method (not part of standard interface)
    const connectorWithWatchAsset = this.connector as Connector & {
      watchAsset?: (params: WatchAssetParams["options"]) => Promise<boolean>;
    };
    if (connectorWithWatchAsset.watchAsset)
      return connectorWithWatchAsset.watchAsset(params.options);

    // some connectors might not have a watchAsset method, like WalletConnect,
    // but the underlying wallet it is connected to might support it
    try {
      // wallet_watchAsset expects the params object directly, not wrapped in an array
      await this.provider.send("wallet_watchAsset", params);
      return true;
    } catch (err) {
      return false;
    }
  }

  protected getBlockExplorerUrls(chain: Chain) {
    const { default: blockExplorer, ...blockExplorers } =
      chain.blockExplorers ?? {};
    if (blockExplorer)
      return [
        blockExplorer.url,
        ...Object.values(blockExplorers).map((x) => x.url),
      ];
  }

  /**
   * Retrieve the underlying BrowserProvider
   *
   * @returns {ethers.BrowserProvider} Returns the underlying ethers.js BrowserProvider if connected, or undefined if not
   */
  getProvider(): ethers.BrowserProvider | undefined {
    return this.provider;
  }

  /**
   * Retrieve the underlying Signer.
   *
   * @returns {ethers.Signer} Returns the underlying ethers.js Signer if connected, or undefined if not
   */
  async getSigner(): Promise<ethers.Signer> {
    if (!this.provider) throw new NotConnected();
    return await this.provider.getSigner(this.address);
  }

  getWalletState(): WalletState {
    // If connector hasn't been created yet, it's not detected
    if (!this.connector) {
      return WalletState.NotDetected;
    }

    // In wagmi v2, connectors are always "loadable" once created
    // The actual detection happens during the connector creation
    return WalletState.Loadable;
  }

  async getBalance(assetAddress?: string): Promise<string> {
    if (!this.isConnected() || !this.provider) throw new NotConnected();
    const signer = await this.getSigner();
    if (!signer) throw new Error("Signer not found");

    if (assetAddress) {
      const erc20 = new ethers.Contract(
        assetAddress,
        [
          "function balanceOf(address) view returns (uint)",
          "function decimals() public view returns (uint8)",
        ],
        signer
      );
      const decimals: number = await erc20.decimals();
      const balance: bigint = await erc20.balanceOf(assetAddress);
      return ethers.formatUnits(balance, decimals);
    }

    const address = await signer.getAddress();
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  protected async onChainChanged(): Promise<void> {
    if (this.autoSwitch) {
      await this.enforcePrefferedChain();
    }

    this.network = await this.fetchNetworkInfo();

    this.emit("networkChanged");
  }

  protected async onAccountsChanged(accounts: string[]): Promise<void> {
    // no new accounts === wallet disconnected
    if (!accounts.length) return this.disconnect();

    const connectorAccounts = await this.connector.getAccounts();
    this.address = connectorAccounts[0];
    this.emit("accountsChanged", accounts);
  }

  protected async onDisconnect(): Promise<void> {
    // Remove specific listeners we added
    this.connector.emitter?.off("change", this.onChange.bind(this));
    this.connector.emitter?.off("disconnect", this.onDisconnect.bind(this));
    // In wagmi v2, config doesn't have destroy method
    this.wagmiConfig = undefined;
    this.emit("disconnect");
  }

  private async fetchNetworkInfo(): Promise<EVMNetworkInfo | undefined> {
    if (!this.isConnected()) return;
    return {
      chainId: await this.connector.getChainId(),
    };
  }

  protected parseEvmChainId(id: string | number): number {
    return ethers.isHexString(id)
      ? parseInt(id.toString().substring(2), 16)
      : (id as number);
  }

  getFeatures(): BaseFeatures[] {
    return Object.values(BaseFeatures);
  }

  supportsChain(chainId: ChainId): boolean {
    return isTestnetEvm(chainId) || isEVMChain(chainId);
  }
}
