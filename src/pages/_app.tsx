import 'styles/style.scss'
import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'
import { app } from 'appConfig'
import { useState, useEffect } from 'react'
import HeadGlobal from 'components/HeadGlobal'
// Web3Wrapper deps:
import { connectorsForWallets, RainbowKitProvider, lightTheme, darkTheme } from '@rainbow-me/rainbowkit'
import {
  injectedWallet,
  metaMaskWallet,
  braveWallet,
  coinbaseWallet,
  walletConnectWallet,
  ledgerWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { Chain } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains'
import { createConfig, configureChains, WagmiConfig } from 'wagmi'
import { infuraProvider } from 'wagmi/providers/infura'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  return (
    <ThemeProvider defaultTheme="system" attribute="class">
      <HeadGlobal />
      <Web3Wrapper>
        <Component key={router.asPath} {...pageProps} />
      </Web3Wrapper>
    </ThemeProvider>
  )
}
export default App

// Add Custom Chain
// Demo purpose, gnosis is included in wagmi/chains
// import { gnosis } from 'wagmi/chains'
const gnosisChain: Chain = {
  id: 100,
  name: 'Gnosis',
  network: 'gnosis',
  iconUrl: 'https://uploads-ssl.webflow.com/63692bf32544bee8b1836ea6/637b0145cf7e15b7fbffd51a_favicon-256.png',
  iconBackground: '#000',
  nativeCurrency: {
    decimals: 18,
    name: 'Gnosis',
    symbol: 'xDAI',
  },
  rpcUrls: {
    default: {
      http: ['https://gnosischain-rpc.gateway.pokt.network'],
    },
    public: {
      http: ['https://gnosischain-rpc.gateway.pokt.network'],
    },
  },
  blockExplorers: {
    etherscan: {
      name: 'Gnosisscan',
      url: 'https://gnosisscan.io/',
    },
    default: {
      name: 'Gnosis Chain Explorer',
      url: 'https://blockscout.com/xdai/mainnet/',
    },
  },
  testnet: false,
}

// Web3 Configs
const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, base, gnosisChain],
  [
    infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_ID !== '' && process.env.NEXT_PUBLIC_INFURA_ID }),
    jsonRpcProvider({
      rpc: chain => {
        if (chain.id !== gnosisChain.id) return null
        return {
          http: `${chain.rpcUrls.default}`,
        }
      },
    }),
    publicProvider(),
  ]
)

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'e3df6fb2d66fdaea0c0d4aa46a2073c0'

const otherWallets = [
  braveWallet({ chains }),
  ledgerWallet({ chains, projectId }),
  coinbaseWallet({ chains, appName: app.name }),
  rainbowWallet({ chains, projectId }),
]

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ chains, projectId }),
      walletConnectWallet({ chains, projectId }),
    ],
  },
  {
    groupName: 'Other Wallets',
    wallets: otherWallets,
  },
])

const wagmiConfig = createConfig({ autoConnect: true, connectors, publicClient })

// Web3Wrapper
export function Web3Wrapper({ children }) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        appInfo={{
          appName: app.name,
          learnMoreUrl: app.url,
        }}
        chains={chains}
        initialChain={1} // Optional, initialChain={1}, initialChain={chain.mainnet}, initialChain={gnosisChain}
        showRecentTransactions={true}
        theme={resolvedTheme === 'dark' ? darkTheme() : lightTheme()}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
