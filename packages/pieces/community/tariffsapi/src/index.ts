import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { tariffsApiAuth } from './lib/auth';
import { apiKeyOf, assertTariffsApiUrl, TARIFFSAPI_BASE_URL } from './lib/common/client';
import { resolveTariffAction } from './lib/actions/resolve-tariff';
import { getByHtsAction } from './lib/actions/get-by-hts';

export const tariffsapi = createPiece({
  displayName: 'Tariffs API',
  description: 'The tariff and HTS source for your AI agents: US import duties by HTS code and origin.',
  auth: tariffsApiAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://tariffsapi.com/icon.svg',
  authors: ['danrod16'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    resolveTariffAction,
    getByHtsAction,
    createCustomApiCallAction({
      baseUrl: () => TARIFFSAPI_BASE_URL,
      auth: tariffsApiAuth,
      authMapping: async (auth, propsValue) => {
        assertTariffsApiUrl({ propsValue });
        return { Authorization: `Bearer ${apiKeyOf(auth)}` };
      },
    }),
  ],
  triggers: [],
});
