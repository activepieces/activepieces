import { createPiece } from '@activepieces/pieces-framework';
import { genderApiAuth } from './lib/common/auth';
import { getStatistics } from './lib/actions/get-statistics';
import { getGenderByFullName } from './lib/actions/get-gender-by-full-name';
import { getGenderByFirstName } from './lib/actions/get-gender-by-first-name';
import { getGenderByEmail } from './lib/actions/get-gender-by-email';
import { getCountryOfOrigin } from './lib/actions/get-country-of-origin';
import { genderApiCommon } from './lib/common/client';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const genderApi = createPiece({
  displayName: 'Gender API',
  auth: genderApiAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/gender-api.png',
  authors: ['sanket-a11y', 'OdaiAhmed99'],
  description: 'Predict gender from a first name, full name or email, and find the likely country of origin of a name, using Gender API.',
  actions: [
    getGenderByFirstName,
    getGenderByFullName,
    getGenderByEmail,
    getCountryOfOrigin,
    getStatistics,
    createCustomApiCallAction({
      auth: genderApiAuth,
      baseUrl: () => genderApiCommon.baseUrl,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [],
});
