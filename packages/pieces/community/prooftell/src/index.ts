import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { prooftellAuth } from './lib/auth';
import { PROOFTELL_API_URL } from './lib/common';
import { lookUpPhoneNumber } from './lib/actions/look-up-a-phone-number';
import { verifyEmailAddress } from './lib/actions/verify-an-email-address';
import { lookUpIpAddress } from './lib/actions/look-up-an-ip-address';
import { assessIdentityRisk } from './lib/actions/assess-the-risk-of-an-identity';

export const prooftell = createPiece({
  displayName: 'ProofTell',
  description:
    'Check a phone number, an email address or an IP address, or assess the three together as a 0–100 risk score with a verdict and its reasons. Charged per check from your balance; the sandbox is free.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://prooftell.com/favicon.svg',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: prooftellAuth,
  authors: ['adbek'],
  actions: [
    lookUpPhoneNumber,
    verifyEmailAddress,
    lookUpIpAddress,
    assessIdentityRisk,
    createCustomApiCallAction({
      baseUrl: () => PROOFTELL_API_URL,
      auth: prooftellAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
