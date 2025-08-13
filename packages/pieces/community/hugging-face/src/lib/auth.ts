import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const huggingFaceAuth = PieceAuth.CustomAuth({
  description: 'Authentication for Hugging Face API',
  required: true,
  props: {
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'Your Hugging Face access token',
      required: true,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'The Hugging Face model to use (e.g., "gpt2", "bert-base-uncased")',
      required: true,
    }),
  },
}); 