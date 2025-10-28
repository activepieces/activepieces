import { straicoAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';

export const listRags = createAction({
  auth: straicoAuth,
  name: 'list_rags',
  displayName: 'List RAGs',
  description: 'List all RAG (Retrieval-Augmented Generation) bases for a user.',
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
        token: auth as string,
      },
    });

    return response.body;
  },
});
