import React from "react";

import {
  Section,
  AccentSection,
  SendWrapper,
  Info,
  SendButton,
} from "./SendForm.styles";
import ChainSelection from "../ChainSelection";
import CoinSelection from "../CoinSelection";
import AddressSelection from "../AddressSelection";
import { useConnection, useGlobal, useSelectedSendArgs } from "state/hooks";
import type { Transfer } from "state/transfers";
import { useSend } from "hooks/useSend";

type Props = {
  onSend: (transfer: Transfer) => void;
};

const SendForm: React.FC<Props> = ({ onSend }) => {
  const { isConnected, provider, signer } = useConnection();

  const { currentChainId, currentAccount, chains } = useGlobal();
  const { fromChain, amount, address, asset } = useSelectedSendArgs();

  const { send, error } = useSend(signer);

  const isCorrectlyConnected = isConnected && currentChainId === fromChain;
  const disableButton = !isCorrectlyConnected;

  const buttonMsg = isConnected ? "Send" : "Connect Wallet";

  console.log(signer);
  const handleSend = () => {
    console.log(`Sending assets...`);
    send({
      l1Recipient: address ?? currentAccount,
      l2Token: asset,
      amount,
    }).then((tx) => console.log(tx));
  };
  return (
    <>
      <Section>
        <ChainSelection />
      </Section>
      <Section>
        <CoinSelection />
      </Section>
      <Section>
        <AddressSelection />
      </Section>
      <AccentSection>
        <SendWrapper>
          <Info>
            <div>Time to Ethereum Mainnet</div>
            <div>~1-3 minutes</div>
          </Info>
          <Info>
            <div>Bridge Fee</div>
            <div>0.05 UMA</div>
          </Info>
          <Info>
            <div>You will get</div>
            <div>90.00 UMA</div>
          </Info>

          <SendButton disabled={disableButton} onClick={handleSend}>
            {buttonMsg}
          </SendButton>
        </SendWrapper>
      </AccentSection>
    </>
  );
};

export default SendForm;
