import { AppConnectionType, PieceAuth, Property, tryCatch } from '@activepieces/pieces-framework';
import { pineconeClient } from './common/client';

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
    const { error } = await tryCatch(() =>
      pineconeClient.create({ auth: { type: AppConnectionType.CUSTOM_AUTH, props: auth } }).indexes.list(),
    );
    if (error) {
      return {
        valid: false,
        error: 'Could not connect to Pinecone. Check that the API key is correct and belongs to the target project.',
      };
    }
    return { valid: true };
  },
});
