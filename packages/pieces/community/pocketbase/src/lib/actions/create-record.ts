import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pocketbaseAuth } from '../../index';
import { pocketbaseAuthenticate, normalizeHost } from '../common/client';

export const createRecord = createAction({
  name: 'createRecord',
  displayName: 'Create Record',
  description: 'Creates a new record in a collection',
  auth: pocketbaseAuth,
  props: {
    collection: Property.ShortText({
      displayName: 'Collection Name',
      description: 'The name of the PocketBase collection',
      required: true,
    }),
    recordData: Property.Json({
      displayName: 'Record Data',
      description: 'JSON object with the fields to create. E.g.: { "title": "test", "score": 123 }',
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
    const { host: rawHost, email, password } = context.auth.props;
    const host = normalizeHost(rawHost);
    const { collection, recordData, expand, fields } = context.propsValue;

    const token = await pocketbaseAuthenticate(host, email, password);

    const queryParams: Record<string, string> = {};
    if (expand) queryParams['expand'] = expand;
    if (fields) queryParams['fields'] = fields;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${host}/api/collections/${encodeURIComponent(collection)}/records`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      queryParams,
      body: recordData,
    });

    return response.body;
  },
});
