import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { transkriptorAuth } from '../auth';
import { BASE_URL } from '../common';

export const deleteFileAction = createAction({
  auth: transkriptorAuth,
  name: 'delete_file',
  classification: 'WRITE',
  displayName: 'Delete File',
  description: 'Permanently deletes a transcription file by its order ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a transcription file from the Transkriptor account. This action is destructive and cannot be undone.',
    idempotent: false,
  },
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order ID of the transcription file to delete.',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      url: `${BASE_URL}/files/${context.propsValue.orderId}`,
      method: HttpMethod.DELETE,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
