import { createPiece } from '@activepieces/pieces-framework';
import { captureCarbon } from './lib/actions/capture-carbon';
import { cleanOcean } from './lib/actions/clean-ocean';
import { donateMoney } from './lib/actions/donate-money';
import { plantTrees } from './lib/actions/plant-trees';
import { oneclickimpactAuth } from './lib/common/auth';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const oneclickimpact = createPiece({
  displayName: '1ClickImpact',
  auth: oneclickimpactAuth,
  minimumSupportedRelease: '0.36.1',
  description: 'Make a positive environmental impact with every transaction.',
  logoUrl: 'https://cdn.activepieces.com/pieces/oneclickimpact.png',
  authors: ['sanket-a11y'],
  actions: [
    captureCarbon,
    cleanOcean,
    donateMoney,
    plantTrees,
    createCustomApiCallAction({
      auth: oneclickimpactAuth,
      baseUrl: () => 'https://api.1clickimpact.com/v1',
      authMapping: async (auth) => {
        return {
          'x-api-key': auth.secret_text,
        };
      },
    }),
  ],
  triggers: [],
});
