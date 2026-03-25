import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { addAttachmentToCandidateAction } from './lib/actions/add-attachment-to-candidate';
import { createCandidateAction } from './lib/actions/create-candidate';
import { createProspectAction } from './lib/actions/create-prospect';
import { greenhouseAuth } from './lib/auth';
import { GREENHOUSE_BASE_URL } from './lib/common/client';

export const greenhouse = createPiece({
  displayName: 'Greenhouse',
  description: 'Applicant tracking system for modern recruiting teams.',
  auth: greenhouseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/greenhouse.png',
  authors: ['Harmatta'],
  categories: [PieceCategory.HUMAN_RESOURCES],
  actions: [
    createCandidateAction,
    createProspectAction,
    addAttachmentToCandidateAction,
    createCustomApiCallAction({
      auth: greenhouseAuth,
      baseUrl: () => GREENHOUSE_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password ?? ''}`).toString('base64')}`,
      }),
    }),
  ],
  triggers: [],
});
