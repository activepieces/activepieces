import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { createCredential } from './lib/actions/create-credential';
import { certopusCommon } from './lib/common';
import { certopusAuth } from './lib/auth';

export const certopus = createPiece({
  displayName: 'Certopus',
  description: 'Your certificates, made simple',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/certopus.png',
  categories: [],
  authors: ["VrajGohil","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  auth: certopusAuth,
  actions: [
    createCredential,
    createCustomApiCallAction({
      baseUrl: () => certopusCommon.baseUrl,
      auth: certopusAuth,
      authMapping: async (auth) => ({
        'x-api-key': auth.secret_text,
      }),
      props: {
        url: {
          description: `Full URL, or a path relative to ${certopusCommon.baseUrl}`,
          placeholder: '/organisations',
        },
      },
    }),
  ],
  triggers: [],
});
