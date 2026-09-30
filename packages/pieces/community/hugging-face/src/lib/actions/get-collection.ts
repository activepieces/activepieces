import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { getCollectionOutputSchema } from '../output-schemas';

export const getCollection = createAction({
  auth: huggingFaceAuth,
  name: 'get_collection',
  classification: 'READ',
  displayName: 'Get Collection',
  description: 'Get one Hugging Face collection with all of its items.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns one Hugging Face collection by its slug: title, description, owner, visibility, upvotes and every item (models, datasets, Spaces, papers or nested collections) with its type, ID and note. Get the slug from List Collections or the collection URL. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getCollectionOutputSchema,
  props: {
    slug: Property.ShortText({
      displayName: 'Collection Slug',
      description:
        "The full collection slug in 'namespace/title-id' form, for example 'meta-llama/llama-32-66f448ffc8c32f949b04c8cf' (the part after huggingface.co/collections/).",
      required: true,
    }),
  },
  async run(context) {
    const segments = context.propsValue.slug
      .trim()
      .replace(/^https?:\/\/huggingface\.co\/collections\//, '')
      .split('/')
      .filter((segment) => segment.length > 0);
    if (segments.length !== 2) {
      throw new Error(
        "Invalid collection slug. Use the 'namespace/title-id' form, for example 'meta-llama/llama-32-66f448ffc8c32f949b04c8cf'."
      );
    }
    const path = `/api/collections/${segments.map(encodeURIComponent).join('/')}`;
    const token = context.auth.secret_text;
    try {
      const response = await hfHub.request<unknown>({ token, method: HttpMethod.GET, path });
      return response.body;
    } catch (error) {
      try {
        const response = await hfHub.request<unknown>({ token, method: HttpMethod.GET, path, anonymous: true });
        return response.body;
      } catch {
        throw error;
      }
    }
  },
});
