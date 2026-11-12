import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../auth';
import { pocketbaseClient } from '../common/client';
import { pocketbaseProps } from '../common/props';

export const getRecordAction = createAction({
  name: 'getRecord',
  classification: 'READ',
  displayName: 'Get Record',
  description: 'Gets a single record by ID from a collection',
  audience: 'both',
  aiMetadata: { description: 'Fetches one record from a PocketBase collection by its record ID, optionally expanding relations or limiting returned fields. Use when you already know the exact record ID; to search or list by criteria use Get List or Get Full List instead. Read-only and idempotent.', idempotent: true },
  auth: pocketbaseAuth,
  props: {
    collection: pocketbaseProps.collection({ required: true }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'ID of the record to view',
      required: true,
    }),
    expand: pocketbaseProps.expand({ required: false }),
    fields: pocketbaseProps.fields({ required: false }),
  },
  async run(context) {
    const { collection, recordId, expand, fields } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (expand) queryParams['expand'] = expand;
    if (fields) queryParams['fields'] = fields;

    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(recordId)}`,
      query: queryParams,
    });
  },
});
