import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { canvaAuth } from './lib/auth';
import { CANVA_BASE_URL } from './lib/common';
import { createDesign } from './lib/actions/create-design';
import { exportDesign } from './lib/actions/export-design';
import { getDesign } from './lib/actions/get-design';
import { listDesigns } from './lib/actions/list-designs';

export const canva = createPiece({
  displayName: 'Canva',
  description:
    'Create stunning designs and visual content with Canva — the world\'s leading online design platform.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['CharlesWong'],
  auth: canvaAuth,
  actions: [
    listDesigns,
    getDesign,
    createDesign,
    exportDesign,
    createCustomApiCallAction({
      baseUrl: () => CANVA_BASE_URL,
      auth: canvaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
