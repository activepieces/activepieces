import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';

export const getRagById = createAction({
  auth: straicoAuth,
  name: 'get_rag_by_id',
  displayName: 'Get RAG by ID',
  description: 'Retrieve a specific RAG (Retrieval-Augmented Generation) base by its ID.',
  props: {
    ragId: Property.ShortText({
      displayName: 'RAG ID',
      required: true,
      description: 'The ID of the RAG base to retrieve.',
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
        token: auth as string,
      },
    });

    return response.body;
  },
});
