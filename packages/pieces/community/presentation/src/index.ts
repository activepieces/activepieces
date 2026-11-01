import { createIntegrationToken } from './lib/actions/ai/create-integration-token';
import { createPresentationFromJson } from './lib/actions/ai/create-presentation-from-json';
import { deleteImage } from './lib/actions/ai/delete-image';
import { exportPresentation } from './lib/actions/ai/export-presentation';
import { generateOutline } from './lib/actions/ai/generate-outline';
import { generatePresentation } from './lib/actions/ai/generate-presentation';
import { getStandardTemplate } from './lib/actions/ai/get-standard-template';
import { getTaskStatus } from './lib/actions/ai/get-task-status';
import { getTemplateExample } from './lib/actions/ai/get-template-example';
import { listImages } from './lib/actions/ai/list-images';
import { listPresentations } from './lib/actions/ai/list-presentations';
import { listSmartDesigns } from './lib/actions/ai/list-smart-designs';
import { listStandardTemplates } from './lib/actions/ai/list-standard-templates';
import { uploadImage } from './lib/actions/ai/upload-image';
import { uploadSourceFiles } from './lib/actions/ai/upload-source-files';
import { createPiece } from '@activepieces/pieces-framework';
import { generatePresentations } from './lib/actions/generate-presentations';

import { presentonAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/pieces-framework';
import { newPresentation } from './lib/triggers/new-presentation';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const presentation = createPiece({
  displayName: 'Presenton',
  description:
    'Generate AI-powered presentations using Presenton (https://presenton.ai). Supports templates, themes, images, synchronous and asynchronous generation, status polling, and export to PPTX/PDF.',
  auth: presentonAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/presenton.png',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.CONTENT_AND_FILES,
  ],
  authors: ['sanket-a11y'],
  actions: [
    generatePresentations,
    createIntegrationToken,
    createPresentationFromJson,
    deleteImage,
    exportPresentation,
    generateOutline,
    generatePresentation,
    getStandardTemplate,
    getTaskStatus,
    getTemplateExample,
    listImages,
    listPresentations,
    listSmartDesigns,
    listStandardTemplates,
    uploadImage,
    uploadSourceFiles,
    createCustomApiCallAction({
      auth: presentonAuth,
      baseUrl: () => 'https://api.presenton.ai/api/v1',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [newPresentation],
});
