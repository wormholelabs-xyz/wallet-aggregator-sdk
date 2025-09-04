import * as CHAINS from "@wagmi/core/chains";
import { Chain } from "@wagmi/core/chains";

export * from "@wagmi/core/chains";

const acala = {
  id: 787,
  name: "Acala",
  nativeCurrency: { name: "Acala Token", symbol: "ACA", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc-acala.aca-api.network"] },
    public: { http: ["https://eth-rpc-acala.aca-api.network"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://blockscout.acala.network" },
  },
} as const satisfies Chain;

const acalaTestnet = {
  id: 597,
  name: "Acala Testnet",
  nativeCurrency: { name: "Acala Token", symbol: "ACA", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://acala-dev.aca-dev.network/eth/http"] },
    public: { http: ["https://acala-dev.aca-dev.network/eth/http"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout.acala-dev.aca-dev.network",
    },
  },
} as const satisfies Chain;

const karura = {
  id: 686,
  name: "Karura",
  nativeCurrency: { name: "Karura Token", symbol: "KAR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc-karura.aca-api.network"] },
    public: { http: ["https://eth-rpc-karura.aca-api.network"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://blockscout.karura.network" },
  },
} as const satisfies Chain;

const karuraTestnet = {
  id: 596,
  name: "Karura Testnet",
  nativeCurrency: { name: "Karura Token", symbol: "KAR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://karura-dev.aca-dev.network/eth/http"] },
    public: { http: ["https://karura-dev.aca-dev.network/eth/http"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout.karura-dev.aca-dev.network",
    },
  },
} as const satisfies Chain;

export const emerald = {
  id: 42262,
  name: "Emerald Paratime Mainnet",
  nativeCurrency: { name: "Emerald Rose", symbol: "ROSE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://emerald.oasis.dev"] },
    public: { http: ["https://emerald.oasis.dev"] },
  },
  blockExplorers: {
    default: { name: "Oasis", url: "https://explorer.emerald.oasis.dev" },
  },
} as const satisfies Chain;

export const emeraldTestnet = {
  id: 42261,
  name: "Emerald Paratime Testnet",
  nativeCurrency: { name: "Emerald Rose", symbol: "ROSE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.emerald.oasis.dev"] },
    public: { http: ["https://testnet.emerald.oasis.dev"] },
  },
  blockExplorers: {
    default: {
      name: "Oasis",
      url: "https://testnet.explorer.emerald.oasis.dev",
    },
  },
} as const satisfies Chain;

// https://docs.blast.io/building/network-information
export const blast = {
  id: 81457,
  name: "Blast Mainnet",
  nativeCurrency: { name: "Blast Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.blast.io"] },
    public: { http: ["	https://rpc.blast.io"] },
  },
  blockExplorers: {
    default: {
      name: "Blast",
      url: "https://blastscan.io",
    },
  },
} as const satisfies Chain;

export const blastSepolia = {
  id: 168587773,
  name: "Blast Sepolia",
  nativeCurrency: { name: "Blast Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia.blast.io"] },
    public: { http: ["https://sepolia.blast.io"] },
  },
  blockExplorers: {
    default: {
      name: "Blast Sepolia Explorer",
      url: "https://sepolia.blastexplorer.io",
    },
  },
} as const satisfies Chain;

export const scroll = {
  id: 534_352,
  name: "Scroll",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.ankr.com/scroll"],
    },
    public: {
      http: ["https://rpc.ankr.com/scroll"],
    },
  },
  blockExplorers: {
    default: {
      name: "Scrollscan",
      url: "https://scrollscan.com",
    },
  },
} as const satisfies Chain;

export const scrollSepolia = {
  id: 534_351,
  name: "Scroll Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.ankr.com/scroll_sepolia_testnet"],
    },
    public: {
      http: ["https://rpc.ankr.com/scroll_sepolia_testnet"],
    },
  },
  blockExplorers: {
    default: {
      name: "Scrollscan",
      url: "https://sepolia.scrollscan.com",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const xlayer = {
  id: 196,
  name: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.xlayer.tech"],
    },
    public: {
      http: ["https://rpc.xlayer.tech"],
    },
  },
  blockExplorers: {
    default: {
      name: "X Layer Explorer",
      url: "https://www.okx.com/web3/explorer/xlayer",
    },
  },
} as const satisfies Chain;

export const xlayerTestnet = {
  id: 195,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://testrpc.xlayer.tech"],
    },
    public: {
      http: ["https://testrpc.xlayer.tech"],
    },
  },
  blockExplorers: {
    default: {
      name: "X Layer Testnet Explorer",
      url: "https://www.okx.com/web3/explorer/xlayer-test",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const mantle = {
  id: 5000,
  name: "Mantle",
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.mantle.xyz"],
    },
    public: {
      http: ["https://rpc.mantle.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Explorer",
      url: "https://explorer.mantle.xyz",
    },
  },
} as const satisfies Chain;

export const mantleTestnet = {
  id: 5000,
  name: "Mantle",
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.mantle.xyz"],
    },
    public: {
      http: ["https://rpc.testnet.mantle.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mantle Explorer",
      url: "https://explorer.testnet.mantle.xyz",
    },
  },
} as const satisfies Chain;

export const worldchain = {
  id: 480,
  name: "World Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://worldchain-mainnet.g.alchemy.com/public"],
    },
    public: {
      http: ["https://worldchain-mainnet.g.alchemy.com/public"],
    },
  },
  blockExplorers: {
    default: {
      name: "World Scan",
      url: "https://worldscan.org/",
    },
  },
} as const satisfies Chain;

export const worldchainTestnet = {
  id: 4801,
  name: "World Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://worldchain-sepolia.g.alchemy.com/public"],
    },
    public: {
      http: ["https://worldchain-sepolia.g.alchemy.com/public"],
    },
  },
  blockExplorers: {
    default: {
      name: "World Scan",
      url: "https://worldchain-sepolia.explorer.alchemy.com/",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const unichain = {
  id: 130,
  name: "Unichain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://mainnet.unichain.org"],
    },
    public: {
      http: ["https://mainnet.unichain.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Unichain Explorer",
      url: "https://unichain.blockscout.com/",
    },
  },
} as const satisfies Chain;

export const unichainTestnet = {
  id: 1301,
  name: "Unichain Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://sepolia.unichain.org"],
    },
    public: {
      http: ["https://sepolia.unichain.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Unichain Explorer",
      url: "https://unichain-sepolia.blockscout.com/",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Oasis",
      url: "https://testnet.explorer.oasis.dev",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const mezo = {
  id: 31612,
  name: "Mezo",
  nativeCurrency: { name: "BTC", symbol: "BTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://jsonrpc-mezo.boar.network"],
    },
    public: {
      http: ["https://jsonrpc-mezo.boar.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mezo Explorer",
      url: "https://explorer.mezo.org/",
    },
  },
  testnet: false,
} as const satisfies Chain;

export const mezoTestnet = {
  id: 31611,
  name: "Mezo Testnet",
  nativeCurrency: { name: "BTC", symbol: "BTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.test.mezo.org"],
    },
    public: {
      http: ["https://rpc.test.mezo.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mezo Explorer",
      url: "https://explorer.test.mezo.org/",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const xrplevmTestnet = {
  id: 1449000,
  name: "XRPL EVM Testnet",
  nativeCurrency: { name: "XRP", symbol: "XRP", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.xrplevm.org"],
    },
    public: {
      http: ["https://rpc.testnet.xrplevm.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "XRPL EVM Explorer",
      url: "https://explorer.testnet.xrplevm.org/",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const xrplevmMainnet = {
  id: 1440000,
  name: "XRPL EVM Mainnet",
  nativeCurrency: { name: "XRP", symbol: "XRP", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.mainnet.xrplevm.org"],
    },
    public: {
      http: ["https://rpc.mainnet.xrplevm.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "XRPL EVM Explorer",
      url: "https://explorer.mainnet.xrplevm.org/",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const hyperEvm = {
  id: 999,
  name: "HyperEVM",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.hyperliquid.xyz/evm"],
    },
    public: {
      http: ["https://rpc.hyperliquid.xyz/evm"],
    },
  },
  blockExplorers: {
    default: {
      name: "HyperEVMScan",
      url: "https://hyperevmscan.io/",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const DEFAULT_CHAINS = [
  ...Object.values(CHAINS),
  acala,
  acalaTestnet,
  blast,
  blastSepolia,
  emerald,
  emeraldTestnet,
  karura,
  karuraTestnet,
  scroll,
  scrollSepolia,
  xlayer,
  xlayerTestnet,
  mantle,
  mantleTestnet,
  worldchain,
  worldchainTestnet,
  unichain,
  unichainTestnet,
  monadTestnet,
  mezo,
  mezoTestnet,
  xrplevmMainnet,
  xrplevmTestnet,
] as const satisfies readonly Chain[];
