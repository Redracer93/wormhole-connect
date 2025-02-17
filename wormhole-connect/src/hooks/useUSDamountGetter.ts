import config from 'config';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import { getTokenPrice } from 'utils';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

export const useUSDamountGetter = (): ((args: {
  token: string;
  amount: sdkAmount.Amount;
}) => number | undefined) => {
  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);

  return useCallback(
    ({ token, amount }) => {
      const prices = data || {};
      const numericAmount = sdkAmount.whole(amount);
      const tokenPrice = Number(getTokenPrice(prices, config.tokens[token]));
      const USDAmount = tokenPrice * numericAmount;

      return isNaN(USDAmount) ? undefined : parseFloat(USDAmount.toFixed(2));
    },
    [data],
  );
};
