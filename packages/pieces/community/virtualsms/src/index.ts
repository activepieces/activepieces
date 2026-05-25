import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { buyNumber } from './lib/action/buy-number';
import { cancelOrder } from './lib/action/cancel-order';
import { checkPrice } from './lib/action/check-price';
import { getBalance } from './lib/action/get-balance';
import { getOrderStatus } from './lib/action/get-order-status';
import { listCountries } from './lib/action/list-countries';
import { listServices } from './lib/action/list-services';

import { lowBalance } from './lib/trigger/low-balance';
import { orderExpired } from './lib/trigger/order-expired';
import { orderReceivedSms } from './lib/trigger/order-received-sms';

import { virtualSmsAuth } from './lib/common';

export { virtualSmsAuth };

export const virtualsms = createPiece({
  displayName: 'VirtualSMS',
  description:
    'Real-SIM SMS verification across 145+ countries and 2,500+ services. Buy disposable phone numbers and receive OTP codes via polling triggers. Long-term rentals also supported.',
  auth: virtualSmsAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://virtualsms.io/branding/icon-256.png',
  authors: ['virtualsms-io'],
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    buyNumber,
    getOrderStatus,
    cancelOrder,
    listServices,
    listCountries,
    checkPrice,
    getBalance,
    createCustomApiCallAction({
      baseUrl: () => 'https://virtualsms.io',
      auth: virtualSmsAuth,
      authMapping: async (auth) => ({
        'X-API-Key': String(auth),
      }),
    }),
  ],
  triggers: [orderReceivedSms, orderExpired, lowBalance],
});
