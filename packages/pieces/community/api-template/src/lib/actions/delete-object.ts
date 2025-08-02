import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { apitemplateAuth } from '../../index';

export const apitemplateDeleteObjectAction = createAction({
  auth: apitemplateAuth,
  name: 'delete_object',
  displayName: 'Delete Object',
  description: 'Delete a generated image or PDF (cleanup old outputs)',
  props: {
    transaction_ref: Property.ShortText({
      displayName: 'Transaction Reference',
      description: 'Object transaction reference to delete',
      required: true,
      defaultValue: '1618d386-2343-3d234-b9c7-99c82bb9f104',
    }),
  },
  async run(context) {
    const { auth } = context;
    const { transaction_ref } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://rest.apitemplate.io/v2/delete-object',
      headers: {
        'X-API-KEY': auth as string,
        'Content-Type': 'application/json',
      },
      queryParams: {
        transaction_ref,
      } as Record<string, string>,
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to delete object: ${response.status}`);
  },
}); 