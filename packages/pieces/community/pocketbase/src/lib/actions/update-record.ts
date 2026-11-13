import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../auth';
import { pocketbaseClient } from '../common/client';
import { pocketbaseProps } from '../common/props';

export const updateRecordAction = createAction({
  name: 'updateRecord',
  classification: 'WRITE',
  displayName: 'Update Record',
  description: 'Updates a single record in a collection',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing record in a PocketBase collection, identified by its record ID, applying a JSON object of field values as a partial patch (only supplied fields change). Use when the record already exists and you know its ID; to insert a new record use Create Record instead. Idempotent — re-applying the same field values to the same ID yields the same result.', idempotent: true },
  auth: pocketbaseAuth,
  props: {
    collection: pocketbaseProps.collection({ required: true }),
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
    expand: pocketbaseProps.expand({ required: false }),
    fields: pocketbaseProps.fields({ required: false }),
  },
  async run(context) {
    const { collection, recordId, recordData, expand, fields } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (expand) queryParams['expand'] = expand;
    if (fields) queryParams['fields'] = fields;

    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: `/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(recordId)}`,
      query: queryParams,
      body: recordData,
    });
  },
});
