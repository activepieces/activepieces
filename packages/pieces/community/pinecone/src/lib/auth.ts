import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const pineconeAuth = PieceAuth.CustomAuth({
  description: 'Configure your Pinecone API key',
  required: true,
  props: {
    apiKey: Property.LongText({
      displayName: 'API Key',
      description: 'Enter your Pinecone API key. You can create a new API key in the Pinecone console for your target project.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const { apiKey } = auth;
      
      if (!apiKey || typeof apiKey !== 'string') {
        return {
          valid: false,
          error: 'API key is required'
        };
      }

      if (apiKey.length < 10) {
        return {
          valid: false,
          error: 'API key appears to be too short. Please check your Pinecone API key.'
        };
      }

      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid authentication configuration'
      };
    }
  }
});
