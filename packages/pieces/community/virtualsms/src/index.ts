import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { buyNumber } from './lib/actions/buy-number';
import { cancelOrder } from './lib/actions/cancel-order';
import { checkPrice } from './lib/actions/check-price';
import { getBalance } from './lib/actions/get-balance';
import { getOrderStatus } from './lib/actions/get-order-status';
import { getProfile } from './lib/actions/get-profile';
import { listCountries } from './lib/actions/list-countries';
import { listOrders } from './lib/actions/list-orders';
import { listServices } from './lib/actions/list-services';
import { listTransactions } from './lib/actions/list-transactions';
import { swapNumber } from './lib/actions/swap-number';
import { orderExpired } from './lib/triggers/order-expired';
import { orderReceivedSms } from './lib/triggers/order-received-sms';

import { virtualSmsAuth } from './lib/common';

export const virtualsms = createPiece({
  displayName: 'VirtualSMS',
  description:
    'Real-SIM SMS verification across 145+ countries and 2,500+ services. Buy disposable phone numbers and receive OTP codes.',
  auth: virtualSmsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/virtualsms.png',
  authors: ['virtualsms-io', 'sanket-a11y'],
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    buyNumber,
    getOrderStatus,
    cancelOrder,
    swapNumber,
    listOrders,
    listServices,
    listCountries,
    checkPrice,
    getBalance,
    getProfile,
    listTransactions,
    createCustomApiCallAction({
      baseUrl: () => 'https://virtualsms.io',
      auth: virtualSmsAuth,
      authMapping: async (auth) => ({
        'X-API-Key': auth.secret_text,
      }),
    }),
  ],
  triggers: [orderReceivedSms, orderExpired],
});
