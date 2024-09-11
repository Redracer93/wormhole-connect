import React, { useMemo, useState } from 'react';
import LaunchIcon from '@mui/icons-material/Launch';
import { useTheme } from '@mui/material';
import Badge from '@mui/material/Badge';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import { WORMSCAN } from 'config/constants';
import TokenIcon from 'icons/TokenIcons';
import {
  calculateUSDPrice,
  getUSDFormat,
  millisToHumanString,
  trimAddress,
  trimTxHash,
} from 'utils';

import type { Transaction } from 'hooks/useFetchTransactionHistory';
import type { TokenPrices } from 'store/tokenPrices';

const useStyles = makeStyles()((theme: any) => ({
  container: {
    width: '100%',
    maxWidth: '420px',
  },
  card: {
    width: '100%',
  },
  cardHeader: {
    paddingBottom: 0,
  },
}));

type Props = {
  data: Transaction;
  tokenPrices: TokenPrices | null;
};

const TxHistoryItem = (props: Props) => {
  const { classes } = useStyles();
  const theme = useTheme();

  const [collapsed, setCollapsed] = useState(true);

  const {
    txHash,
    sender,
    amount,
    amountUsd,
    recipient,
    toChain,
    fromChain,
    tokenKey,
    receivedTokenKey,
    receiveAmount,
    relayerFee,
    senderTimestamp,
    receiverTimestamp,
  } = props.data;

  // Render details for the sent amount
  const sentAmount = useMemo(() => {
    const sourceTokenConfig = config.tokens[tokenKey];
    const sourceChainConfig = config.chains[fromChain]!;

    const senderAddress = sender ? trimAddress(sender) : '';

    return (
      <Stack alignItems="center" direction="row" justifyContent="flex-start">
        <Badge
          badgeContent={
            <TokenIcon icon={sourceChainConfig?.icon} height={16} />
          }
          sx={{
            marginRight: '4px',
            '& .MuiBadge-badge': {
              right: 2,
              top: 24,
            },
          }}
        >
          <TokenIcon icon={sourceTokenConfig?.icon} height={32} />
        </Badge>
        <Stack direction="column" marginLeft="12px">
          <Typography fontSize={16}>
            {amount} {sourceTokenConfig?.symbol}
          </Typography>
          <Typography color={theme.palette.text.secondary} fontSize={14}>
            {`${getUSDFormat(amountUsd, true)} \u2022 ${
              sourceChainConfig?.displayName
            } ${senderAddress}`}
          </Typography>
        </Stack>
      </Stack>
    );
  }, [amount, fromChain, sender, tokenKey]);

  // Render details for the received amount
  const receivedAmount = useMemo(() => {
    const destChainConfig = config.chains[toChain]!;
    const destTokenConfig = receivedTokenKey
      ? config.tokens[receivedTokenKey]
      : undefined;

    const recipientAddress = recipient ? trimAddress(recipient) : '';

    const receiveAmountPrice = calculateUSDPrice(
      receiveAmount,
      props.tokenPrices,
      destTokenConfig,
      true,
    );

    const receiveAmountDisplay = receiveAmountPrice
      ? `${receiveAmountPrice} \u2022 `
      : '';

    return (
      <Stack alignItems="center" direction="row" justifyContent="flex-start">
        <Badge
          badgeContent={<TokenIcon icon={destChainConfig?.icon} height={16} />}
          sx={{
            marginRight: '4px',
            '& .MuiBadge-badge': {
              right: 2,
              top: 24,
            },
          }}
        >
          <TokenIcon icon={destTokenConfig?.icon} height={32} />
        </Badge>
        <Stack direction="column" marginLeft="12px">
          <Typography fontSize={16}>
            {receiveAmount} {destTokenConfig?.symbol}
          </Typography>
          <Typography color={theme.palette.text.secondary} fontSize={14}>
            {`${receiveAmountDisplay}${destChainConfig?.displayName} ${recipientAddress}`}
          </Typography>
        </Stack>
      </Stack>
    );
  }, [props.tokenPrices, receiveAmount, receivedTokenKey, recipient, toChain]);

  // Vertical line that connects sender and receiver token icons
  const verticalConnector = useMemo(
    () => (
      <Stack
        height="32px"
        borderLeft="1px solid #8B919D"
        marginLeft="16px"
      ></Stack>
    ),
    [],
  );

  const bridgeFee = useMemo(() => {
    if (!relayerFee) {
      return <></>;
    }

    const sourceTokenConfig = config.tokens[tokenKey];

    const feeAmountPrice = calculateUSDPrice(
      relayerFee.fee,
      props.tokenPrices,
      sourceTokenConfig,
      true,
    );

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Bridge fee
        </Typography>
        <Typography fontSize={14}>{feeAmountPrice}</Typography>
      </Stack>
    );
  }, [props.tokenPrices, relayerFee, tokenKey]);

  const timeToDestination = useMemo(() => {
    if (!senderTimestamp || !receiverTimestamp) {
      return null;
    }

    const senderDate = new Date(senderTimestamp);
    const receiverDate = new Date(receiverTimestamp);
    const timePassed = receiverDate.getTime() - senderDate.getTime();

    return (
      <Stack direction="row" justifyContent="space-between">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          Time to destination
        </Typography>

        <Typography fontSize={14}>{millisToHumanString(timePassed)}</Typography>
      </Stack>
    );
  }, [senderTimestamp, receiverTimestamp]);

  const wormscanLink = useMemo(() => {
    const href = `${WORMSCAN}tx/${txHash}${
      config.isMainnet ? '' : '?network=TESTNET'
    }`;

    return (
      <Stack alignItems="center">
        <Link
          display="flex"
          gap="8px"
          href={href}
          rel="noreferrer"
          target="_blank"
          underline="none"
        >
          <Typography>View on Wormholescan</Typography>
          <LaunchIcon fontSize="small" sx={{ marginTop: '2px' }} />
        </Link>
      </Stack>
    );
  }, [txHash]);

  const transactionDateTime = useMemo(() => {
    if (!senderTimestamp) {
      return 'Unknown time';
    }

    const senderDate = new Date(senderTimestamp);

    return `${senderDate.toLocaleDateString()} ${senderDate.toLocaleTimeString()}`;
  }, [senderTimestamp]);

  return (
    <div className={classes.container}>
      <Card className={classes.card}>
        <CardActionArea
          disableTouchRipple
          onClick={() => {
            setCollapsed((collapsed) => !collapsed);
          }}
        >
          <CardHeader
            className={classes.cardHeader}
            title={
              <Typography
                justifyContent="space-between"
                color={theme.palette.text.secondary}
                display="flex"
              >
                <span>{`Transaction # ${trimTxHash(txHash)}`}</span>
                <span>{transactionDateTime}</span>
              </Typography>
            }
          />
          <CardContent>
            {sentAmount}
            {verticalConnector}
            {receivedAmount}
            <Collapse in={!collapsed}>
              <Stack
                direction="column"
                gap="8px"
                justifyContent="space-between"
                marginTop="16px"
              >
                {bridgeFee}
                {timeToDestination}
              </Stack>
              <Divider flexItem sx={{ margin: '16px 0', opacity: '50%' }} />
              {wormscanLink}
            </Collapse>
          </CardContent>
        </CardActionArea>
      </Card>
    </div>
  );
};

export default TxHistoryItem;