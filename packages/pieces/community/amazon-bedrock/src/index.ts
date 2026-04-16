import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendPrompt } from './lib/actions/send-prompt';
import { generateContentFromImage } from './lib/actions/generate-content-from-image';
import { generateImage } from './lib/actions/generate-image';
import { generateEmbeddings } from './lib/actions/generate-embeddings';
import { customApiCall } from './lib/actions/custom-api-call';
import { awsBedrockAuth } from './lib/auth';

export const awsBedrock = createPiece({
  displayName: 'AWS Bedrock',
  description: 'Build generative AI applications with foundation models',
  auth: awsBedrockAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-bedrock.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["onyedikachi-david"],
  actions: [sendPrompt, generateContentFromImage, generateImage, generateEmbeddings, customApiCall],
  triggers: [],
});
