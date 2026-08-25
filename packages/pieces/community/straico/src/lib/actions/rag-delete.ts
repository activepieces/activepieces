import { straicoAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';

export const deleteRag = createAction({
  audience: 'both',
  auth: straicoAuth,
  name: 'delete_rag',
  displayName: 'Delete RAG',
  description: 'Delete a specific RAG (Retrieval-Augmented Generation) base by its ID.',
  aiMetadata: { description: 'Permanently deletes a RAG knowledge base and its indexed documents from the account. Use it to retire a corpus entirely; there is no action to remove a single file from a base, so rebuilding a smaller base means Create RAG again. Requires a raw RAG id typed as text, obtainable from List RAGs, and any agent still pointing at that base will lose its grounding. Idempotent: the base ends up gone regardless of how many times it is called.', idempotent: true },
  props: {
    ragId: Property.ShortText({
      displayName: 'RAG ID',
      required: true,
      description: 'The ID of the RAG base to delete',
    }),
  },
  async run({ auth, propsValue }) {
    const { ragId } = propsValue;

    if (!ragId) {
      throw new Error('RAG ID is required');
    }

    const response = await httpClient.sendRequest<{
      success: boolean;
      message: string;
    }>({
      url: `${baseUrlv0}/rag/${ragId}`,
      method: HttpMethod.DELETE,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    return response.body;
  },
});
