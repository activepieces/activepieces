import {
  createPiece,
  PieceAuth,
  PieceCategory,
} from '@activepieces/pieces-framework';
import { estimateCashOut } from './lib/actions/estimate-cash-out';
import { finalizeCashOut } from './lib/actions/finalize-cash-out';
import { getCapabilities } from './lib/actions/get-capabilities';
import { getOrder } from './lib/actions/get-order';
import { listOrders } from './lib/actions/list-orders';
import { prepareAccessPolicy } from './lib/actions/prepare-access-policy';
import { prepareCashOut } from './lib/actions/prepare-cash-out';
import { prepareTopUp } from './lib/actions/prepare-top-up';
import { prepareWithdrawal } from './lib/actions/prepare-withdrawal';

export const peerCash = createPiece({
  displayName: 'Peer Cash',
  description:
    'Cash out Base USDC to fiat at the live oracle rate with unsigned transactions.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/peer-cash.png',
  categories: [PieceCategory.PAYMENT_PROCESSING],
  authors: ['ADWilkinson'],
  actions: [
    getCapabilities,
    estimateCashOut,
    prepareCashOut,
    finalizeCashOut,
    prepareAccessPolicy,
    getOrder,
    listOrders,
    prepareWithdrawal,
    prepareTopUp,
  ],
  triggers: [],
});
