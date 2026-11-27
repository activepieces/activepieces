import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { greipAuth } from './lib/auth';
import { asnLookupAction } from './lib/actions/asn-lookup';
import { binLookupAction } from './lib/actions/bin-lookup';
import { ipLookupAction } from './lib/actions/ip-lookup';
import { emailValidationAction } from './lib/actions/email-validation';
import { profanityDetectionAction } from './lib/actions/profanity-detection';
import { phoneValidationAction } from './lib/actions/phone-validation';
import { proxyConnectionDetectedTrigger } from './lib/triggers/proxy-connection-detected';
import { fraudulentPaymentDetectedTrigger } from './lib/triggers/fraudulent-payment-detected';
import { profanityTextDetectedTrigger } from './lib/triggers/profanity-text-detected';
import { spamEmailDetectedTrigger } from './lib/triggers/spam-email-detected';
import { spamPhoneDetectedTrigger } from './lib/triggers/spam-phone-detected';

export const greip = createPiece({
  displayName: 'Greip',
  description: 'Detect and prevent fraud in your website or app with Greip\'s Fraud Prevention API. Protect your business from financial losses and gain better insights into your users.',
  auth: greipAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/greip.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ["onyedikachi-david"],
  actions: [asnLookupAction, binLookupAction, ipLookupAction, emailValidationAction, profanityDetectionAction, phoneValidationAction],
  triggers: [
    proxyConnectionDetectedTrigger,
    fraudulentPaymentDetectedTrigger,
    profanityTextDetectedTrigger,
    spamEmailDetectedTrigger,
    spamPhoneDetectedTrigger,
  ],
});