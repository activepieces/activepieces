import {
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { sendPrompt } from './lib/actions/send-prompt';
import { generateContentFromImage } from './lib/actions/generate-content-from-image';
import { generateImage } from './lib/actions/generate-image';
import { generateEmbeddings } from './lib/actions/generate-embeddings';
import { awsBedrockCombinedAuth } from './lib/auth';

export const awsBedrock = createPiece({
  displayName: 'AWS Bedrock (Deprecated)',
  description: 'Build generative AI applications with foundation models',
  auth: awsBedrockCombinedAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-bedrock.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["onyedikachi-david"],
  actions: [sendPrompt, generateContentFromImage, generateImage, generateEmbeddings],
  triggers: [],
});
