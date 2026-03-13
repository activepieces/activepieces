import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pocketbaseAuth } from '../../index';

export const updateRecord = createAction({
  name: 'updateRecord',
  displayName: 'Update Record',
  description: 'Updates a single record in a collection',
  auth: pocketbaseAuth,
  props: {
    collection: Property.ShortText({
      displayName: 'Collection Name',
      description: 'The name of the PocketBase collection',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'ID of the record to update',
      required: true,
    }),
    recordData: Property.Json({
      displayName: 'Record Data',
      description: 'JSON object with the fields to update. E.g.: { "title": "test", "score": 123 }',
      required: true,
    }),
    expand: Property.ShortText({
      displayName: 'Expand',
      description: 'Auto expand relations. E.g.: relField1,relField2.subRelField',
      required: false,
    }),
    fields: Property.ShortText({
      displayName: 'Fields',
      description: 'Comma separated fields to return. E.g.: *,expand.relField.name',
      required: false,
    }),
  },
  async run(context) {
    const { host, email, password } = context.auth.props;
    const { collection, recordId, recordData, expand, fields } = context.propsValue;

    const authResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${host}/api/collections/_superusers/auth-with-password`,
      body: {
        identity: email,
        password: password,
      },
    });

    const token = authResponse.body.token;

    const queryParams: Record<string, string> = {};
    if (expand) queryParams['expand'] = expand;
    if (fields) queryParams['fields'] = fields;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `${host}/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(recordId)}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      queryParams,
      body: recordData,
    });

    return response.body;
  },
});
