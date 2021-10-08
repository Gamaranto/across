import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { ERC20Ethers__factory } from "@uma/contracts-frontend";

import { COIN_LIST, getDepositBox, getRelayFees, PROVIDERS } from "utils";
import { useGlobal } from "state/hooks";

type SendArgs = {
  l1Recipient: string;
  l2Token: string;
  amount: ethers.BigNumber;
};
export function useSend(signer?: ethers.Signer) {
  const [error, setError] = useState<Error>();
  const { addTransaction } = useGlobal();

  console.log("useSend signer", signer);
  const send = useCallback(
    async ({ l2Token, l1Recipient, amount }: SendArgs) => {
      if (!signer) {
        console.log("no signer");
        return;
      }
      const isETH = l2Token === ethers.constants.AddressZero;
      try {
        const account = await signer.getAddress();
        const chainId = await signer.getChainId();

        const depositBox = getDepositBox(chainId, signer);
        let l2TokenAddress = l2Token;
        let txValue = ethers.BigNumber.from(0);

        if (isETH) {
          l2TokenAddress = COIN_LIST[chainId].find(
            (coin) => coin.symbol === "WETH"
          )?.address as string;
          txValue = amount;
          if (!l2TokenAddress) {
            throw new Error("WETH address not found.");
          }
        }
        if (!isETH) {
          const token = ERC20Ethers__factory.connect(l2Token, signer);
          const allowance = await token.allowance(account, depositBox.address);
          const hasToApprove = allowance.lt(amount);
          if (hasToApprove) {
            const approveTx = await token.approve(
              depositBox.address,
              ethers.constants.MaxUint256
            );

            addTransaction({
              chainId,
              address: account,
              transaction: {
                ...approveTx,
                meta: {
                  label: "approve",
                },
              },
            });
            await approveTx.wait();
          }
        }
        console.log({
          isETH,
          l1Recipient,
          l2TokenAddress,
          txValue,
          amount,
          depositBox,
          account,
          chainId,
        });
        const { slowRelayFee, instantRelayFee } = await getRelayFees();
        const lastBlock = await PROVIDERS[chainId].getBlock("latest");
        const depositTx = await depositBox.deposit(
          l1Recipient,
          l2TokenAddress,
          amount,
          slowRelayFee,
          instantRelayFee,
          lastBlock.timestamp,
          // @ts-expect-error for some reason TS doesn't value as an ovveride even if the interface seems to support it
          { value: txValue }
        );

        addTransaction({
          chainId,
          address: account,
          transaction: {
            ...depositTx,
            meta: {
              label: "deposit",
            },
          },
        });
      } catch (err: any) {
        setError(err);
      }
    },
    [addTransaction, signer]
  );
  return {
    send,
    error,
  };
}
