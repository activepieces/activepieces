
    import { createPiece } from "@activepieces/pieces-framework";
    import { gammaAuth } from './lib/common/auth';
    import { generateGamma } from './lib/actions/generate-gamma';
    import { getGeneration } from './lib/actions/get-generation';

    export const gamma = createPiece({
      displayName: 'Gamma',
      auth: gammaAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/gamma.png',
      authors: ['Prabhukiran161'],
      actions: [generateGamma, getGeneration],
      triggers: [],
    });
    