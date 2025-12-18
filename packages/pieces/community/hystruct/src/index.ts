import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createJob } from './lib/actions/create-job';
import { workflowEvent } from './lib/triggers/workflow-event';

export const hystructAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your API key:
1. Log in to your Hystruct dashboard
2. Click on your profile picture (top right)
3. Click **Settings**
4. Click **API Keys**
5. Copy and paste your API key here
`,
  required: true,
});

export const hystruct = createPiece({
  displayName: 'Hystruct',
  description: 'AI-powered document structuring and data extraction',
  auth: hystructAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/hystruct.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['onyedikachi-david'],
  actions: [createJob],
  triggers: [workflowEvent],
});
