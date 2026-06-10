import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { alaiAuth } from './lib/common/auth';
import { generatePresentation } from './lib/actions/generate-presentation';
import { getGeneration } from './lib/actions/get-generation';
import { exportPresentation } from './lib/actions/export-presentation';
import { addSlide } from './lib/actions/add-slide';
import { deletePresentation } from './lib/actions/delete-presentation';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const alai = createPiece({
  displayName: 'Alai',
  auth: alaiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/alai.png',
  authors: ['getalai','sanket-a11y'],
  description:
    'AI-powered presentation generation API. Create, export, and manage professional presentations from text.',
  categories: [
    PieceCategory.CONTENT_AND_FILES,
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
  ],
  actions: [
    generatePresentation,
    getGeneration,
    exportPresentation,
    addSlide,
    deletePresentation,
    createCustomApiCallAction({
      auth: alaiAuth,
      baseUrl: () => 'https://slides-api.getalai.com/api/v1',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.props.apiKey}`,
        };
      },
    }),
  ],
  triggers: [],
});
