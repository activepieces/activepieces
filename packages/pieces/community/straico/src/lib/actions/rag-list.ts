import { straicoAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';

export const listRags = createAction({
  audience: 'both',
  auth: straicoAuth,
  name: 'list_rags',
  displayName: 'List RAGs',
  description: 'List all RAG (Retrieval-Augmented Generation) bases for a user.',
  aiMetadata: { description: 'Returns every RAG knowledge base owned by the authenticated account with its id, name, source filename and chunking settings. Use it as the id-discovery step, since Get RAG by ID, Update RAG, Delete RAG and RAG Prompt Completion all take a raw id typed as text; prefer Get RAG by ID once that id is known. Takes no inputs and offers no server-side filtering or search. Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
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
      }[];
    }>({
      url: `${baseUrlv0}/rag/user`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    return response.body;
  },
});
