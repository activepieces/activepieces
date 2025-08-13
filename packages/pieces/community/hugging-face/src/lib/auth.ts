import { PieceAuth } from '@activepieces/pieces-framework';

export const huggingFaceAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Hugging Face API key for accessing the inference API',
}); 