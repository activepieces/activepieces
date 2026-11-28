import { straicoAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';

export const getRagById = createAction({
  audience: 'both',
  auth: straicoAuth,
  name: 'get_rag_by_id',
  displayName: 'Get RAG by ID',
  description: "Get a knowledge base's details by its ID.",
  aiMetadata: { description: 'Fetches the stored configuration of one RAG knowledge base, including its name, source filename and chunking settings. Use it to confirm a base exists or inspect how it was indexed before querying it; prefer List RAGs to discover ids or compare bases, and RAG Prompt Completion to actually search its contents, since this returns metadata only and no document text. Requires a raw RAG id typed as text. Read-only and idempotent.', idempotent: true },
  props: {
    ragId: Property.ShortText({
      displayName: 'RAG ID',
      required: true,
      description: 'The knowledge base (RAG) ID. Find it with the List RAGs action.',
      placeholder: 'e.g. 66a1f0c2b3d4e5f6a7b8c9d0',
    }),
  },
  async run({ auth, propsValue }) {
    const { ragId } = propsValue;

    if (!ragId) {
      throw new Error('RAG ID is required');
    }

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: {
        _id: string;
        user_id: string;
        name: string;
        tag_url: string;
        original_filename: string;
        chunking_method: string;
        chunk_size: number;
        chunk_overlap: number;
        createdAt: string;
        updatedAt: string;
        __v: number;
      };
    }>({
      url: `${baseUrlv0}/rag/${ragId}`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    return response.body;
  },
});
