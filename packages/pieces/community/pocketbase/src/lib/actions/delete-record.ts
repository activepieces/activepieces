import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pocketbaseAuth } from '../../index';

export const deleteRecord = createAction({
  name: 'deleteRecord',
  displayName: 'Delete Record',
  description: 'Deletes a single record from a collection',
  auth: pocketbaseAuth,
  props: {
    collection: Property.ShortText({
      displayName: 'Collection Name',
      description: 'The name of the PocketBase collection',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'ID of the record to delete',
      required: true,
    }),
  },
  async run(context) {
    const { host, email, password } = context.auth.props;
    const { collection, recordId } = context.propsValue;

    const authResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${host}/api/collections/_superusers/auth-with-password`,
      body: {
        identity: email,
        password: password,
      },
    });

    const token = authResponse.body.token;

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${host}/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(recordId)}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true };
  },
});
