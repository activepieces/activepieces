import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { easyPeasyAiAuth } from './lib/common/auth';
import { customGeneratorText } from './lib/actions/custom-generator-text';
import { generateBotResponse } from './lib/actions/generate-bot-response';
import { getAiTranscription } from './lib/actions/get-ai-transcription';
import { generateResponseToEmail } from './lib/actions/generate-response-to-email';

export const easyPeasyAi = createPiece({
  displayName: 'Easy-Peasy.AI',
  auth: easyPeasyAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/easy-peasy-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['sanket-a11y'],
  actions: [
    customGeneratorText,
    generateBotResponse,
    generateResponseToEmail,
    getAiTranscription,
  ],
  triggers: [],
});
