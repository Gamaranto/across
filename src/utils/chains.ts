import { ethers } from "ethers";

import { CHAINS, ChainId } from "./constants";

export async function switchChain(
  provider: ethers.providers.JsonRpcProvider,
  chainId: ChainId
) {
  try {
    await provider.send("wallet_switchEthereumChain", [
      {
        chainId: ethers.utils.hexValue(chainId),
      },
    ]);
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await provider.send("wallet_addEthereumChain", [
          {
            chainId: ethers.utils.hexValue(chainId),
            chainName: CHAINS[chainId].name,
            rpcUrls: [CHAINS[chainId].rpcUrl],
            blockExplorerUrls: [CHAINS[chainId].explorerUrl],
            nativeCurrency: CHAINS[chainId].nativeCurrency,
          },
        ]);
      } catch (addError) {
        console.error(`Failed to add ${CHAINS[chainId].name}`);
        throw switchError;
      }
    } else {
      console.error(`Failed to switch to ${CHAINS[chainId].name}`);
      throw switchError;
    }
  }
}

export function isSupportedChainId(chainId: number): chainId is ChainId {
  return chainId in ChainId;
}
