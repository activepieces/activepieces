import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';

export const deleteRag = createAction({
  auth: straicoAuth,
  name: 'delete_rag',
  displayName: 'Delete RAG',
  description: 'Delete a specific RAG (Retrieval-Augmented Generation) base by its ID.',
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
        token: auth as string,
      },
    });

    return response.body;
  },
});
