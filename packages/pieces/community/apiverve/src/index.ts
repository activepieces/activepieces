import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { checkSslCertificateAction } from './lib/actions/check-ssl-certificate';
import { getExchangeRateAction } from './lib/actions/get-exchange-rate';
import { lookupDnsRecordsAction } from './lib/actions/lookup-dns-records';
import { lookupIpAddressAction } from './lib/actions/lookup-ip-address';
import { runApiAction } from './lib/actions/run-api';
import { validateEmailAction } from './lib/actions/validate-email';
import { validatePhoneNumberAction } from './lib/actions/validate-phone-number';
import { apiverveAuth } from './lib/auth';
import { APIVERVE_BASE_URL } from './lib/common';

export const apiverve = createPiece({
  displayName: 'APIVerve',
  description:
    'Hundreds of ready-to-use APIs behind one key: validate emails and phone numbers, look up IPs, DNS and SSL, get exchange rates, and more.',
  auth: apiverveAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/apiverve.png',
  categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['charifield'],
  actions: [
    validateEmailAction,
    validatePhoneNumberAction,
    lookupIpAddressAction,
    lookupDnsRecordsAction,
    checkSslCertificateAction,
    getExchangeRateAction,
    runApiAction,
    createCustomApiCallAction({
      auth: apiverveAuth,
      baseUrl: () => APIVERVE_BASE_URL,
      authMapping: async (auth) => ({
        'x-api-key': auth.secret_text,
      }),
      classification: 'READ',
      props: {
        url: {
          description:
            'Full URL, or a path relative to https://api.apiverve.com, for example /v1/iplookup?ip=8.8.8.8',
        },
      },
    }),
  ],
  triggers: [],
});
