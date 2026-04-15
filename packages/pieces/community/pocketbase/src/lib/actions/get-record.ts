import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pocketbaseAuth } from '../../index';
import { pocketbaseAuthenticate, normalizeHost } from '../common/client';

export const getRecord = createAction({
  name: 'getRecord',
  displayName: 'Get Record',
  description: 'Gets a single record by ID from a collection',
  auth: pocketbaseAuth,
  props: {
    collection: Property.ShortText({
      displayName: 'Collection Name',
      description: 'The name of the PocketBase collection',
      required: true,
    }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'ID of the record to view',
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
    const { collection, recordId, expand, fields } = context.propsValue;

    const token = await pocketbaseAuthenticate(host, email, password);

    const queryParams: Record<string, string> = {};
    if (expand) queryParams['expand'] = expand;
    if (fields) queryParams['fields'] = fields;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${host}/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(recordId)}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      queryParams,
    });

    return response.body;
  },
});
