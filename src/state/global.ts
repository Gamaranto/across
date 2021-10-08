import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ethers } from "ethers";
import { update } from "./connection";

type Transaction = ethers.Transaction & { meta?: any };
type Account = {
  account?: string;
  provider?: ethers.providers.Web3Provider;
  signer?: ethers.Signer;
  transactions: Record<string, Transaction>;
  balances: Record<string, ethers.BigNumber>;
};

type ChainState = {
  accounts: Record<string, Account>;
};
type State = {
  currentChainId: number;
  currentAccount: string;
  chains: Record<number, ChainState>;
};

const initialState: State = {
  currentChainId: 10,
  currentAccount: "",
  chains: {
    1: {
      accounts: {},
    },
    42: {
      accounts: {},
    },
    10: {
      accounts: {},
    },
    69: {
      accounts: {},
    },
    1337: {
      accounts: {},
    },
  },
};

type ChangeBalancesPayload = {
  chainId: number;
  address: string;
  balances: Record<string, ethers.BigNumber>;
};

type ChangeTransactionsPayload = {
  chainId: number;
  address: string;
  transaction: Transaction;
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    balances: (state, action: PayloadAction<ChangeBalancesPayload>) => {
      const { address, balances, chainId } = action.payload;

      state.chains[chainId].accounts[address] = {
        ...state.chains[chainId].accounts[address],
        balances,
      };
      return state;
    },
    transactions: (state, action: PayloadAction<ChangeTransactionsPayload>) => {
      const { address, transaction, chainId } = action.payload;
      if (!transaction.hash) {
        return state;
      }

      state.chains[chainId].accounts[address] = {
        ...state.chains[chainId].accounts[address],
        transactions: {
          ...state.chains[chainId].accounts[address].transactions,
          [transaction.hash]: transaction,
        },
      };

      return state;
    },
  },
  extraReducers: (builder) =>
    builder
      .addMatcher(
        (action) =>
          action.type === update.type && Boolean(action.payload.account),
        (state, action: PayloadAction<{ account: string }>) => {
          const { account } = action.payload;
          state.currentAccount = account;
          return state;
        }
      )
      .addMatcher(
        (action) =>
          action.type === update.type && Boolean(action.payload.chainId),
        (state, action: PayloadAction<{ chainId: number }>) => {
          const { chainId } = action.payload;
          state.currentChainId = chainId;
          return state;
        }
      )
      .addMatcher(
        (action) => action.type === update.type,
        (state, action: ReturnType<typeof update>) => {
          const { provider, signer } = action.payload;

          if (provider) {
            state.chains[state.currentChainId].accounts[state.currentAccount] =
              {
                ...state.chains[state.currentChainId].accounts[
                  state.currentAccount
                ],
                provider,
              };
          }
          if (signer) {
            state.chains[state.currentChainId].accounts[state.currentAccount] =
              {
                ...state.chains[state.currentChainId].accounts[
                  state.currentAccount
                ],
                signer,
              };
          }
          return state;
        }
      ),
});

const { actions, reducer } = globalSlice;
// Extract and export each action creator by name
export const { balances, transactions } = actions;
// Export the reducer, either as a default or named export
export default reducer;
