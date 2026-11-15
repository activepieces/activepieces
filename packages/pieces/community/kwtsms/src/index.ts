// 2026-11-16 +03: kwtSMS piece (Kuwait SMS gateway, kwtsms.com): send SMS, balance, validate numbers, message status.
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { kwtsmsAuth } from './lib/auth';
import { kwtsmsGetBalance } from './lib/action/get-balance';
import { kwtsmsMessageStatus } from './lib/action/message-status';
import { kwtsmsSendSms } from './lib/action/send-sms';
import { kwtsmsValidateNumbers } from './lib/action/validate-numbers';

export { kwtsmsAuth };

export const kwtsms = createPiece({
  displayName: 'kwtSMS',
  description:
    'Kuwait SMS gateway. Send Arabic and English SMS, check credits, validate numbers and track messages.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/kwtsms.png',
  auth: kwtsmsAuth,
  categories: [PieceCategory.COMMUNICATION],
  authors: ['boxlinknet'],
  actions: [
    kwtsmsSendSms,
    kwtsmsGetBalance,
    kwtsmsValidateNumbers,
    kwtsmsMessageStatus,
  ],
  triggers: [],
});
