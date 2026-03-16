import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getTokenBalances } from './lib/actions/get-token-balances';
import { getNftBalances } from './lib/actions/get-nft-balances';
import { getTransactions } from './lib/actions/get-transactions';
import { getTokenHolders } from './lib/actions/get-token-holders';
import { getLogEvents } from './lib/actions/get-log-events';

export const covalentAuth = PieceAuth.SecretText({
  displayName: 'Covalent API Key',
  description:
    'Get your API key from https://www.covalenthq.com/platform/ after creating a free account.',
  required: true,
});

export const covalent = createPiece({
  displayName: 'Covalent',
  description:
    'Access unified multi-chain blockchain data across 100+ networks including token balances, NFTs, transactions, token holders, and log events via the Covalent GoldRush API.',
  auth: covalentAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/covalent.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['bossco7598'],
  actions: [
    getTokenBalances,
    getNftBalances,
    getTransactions,
    getTokenHolders,
    getLogEvents,
  ],
  triggers: [],
});
