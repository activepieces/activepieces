import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const huggingFaceAuth = PieceAuth.CustomAuth({
  description: 'Authentication for Hugging Face API',
  required: true,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Hugging Face API key',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Hugging Face API base URL (optional, defaults to https://api-inference.huggingface.co)',
      required: false,
      defaultValue: 'https://api-inference.huggingface.co',
    }),
  },
}); 