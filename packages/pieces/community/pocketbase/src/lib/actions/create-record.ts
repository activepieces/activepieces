import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../auth';
import { pocketbaseClient } from '../common/client';
import { pocketbaseProps } from '../common/props';

export const createRecordAction = createAction({
  name: 'createRecord',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Creates a new record in a collection',
  audience: 'both',
  aiMetadata: { description: 'Creates a new record in a PocketBase collection from a JSON object of field values. Use to insert data; this is not idempotent — each call creates a distinct record (PocketBase assigns a fresh ID), so repeating it produces duplicates. To change an existing record use Update Record instead.', idempotent: false },
  auth: pocketbaseAuth,
  props: {
    collection: pocketbaseProps.collection({ required: true }),
    recordData: Property.Json({
      displayName: 'Record Data',
      description: 'JSON object with the fields to create. E.g.: { "title": "test", "score": 123 }',
      required: true,
    }),
    expand: pocketbaseProps.expand({ required: false }),
    fields: pocketbaseProps.fields({ required: false }),
  },
  async run(context) {
    const { collection, recordData, expand, fields } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (expand) queryParams['expand'] = expand;
    if (fields) queryParams['fields'] = fields;

    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/api/collections/${encodeURIComponent(collection)}/records`,
      query: queryParams,
      body: recordData,
    });
  },
});
