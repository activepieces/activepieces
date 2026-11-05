import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseAiProps } from '../../../common/ai-props';
import { pocketbaseClient } from '../../../common/client';
import type { PocketbaseCollection } from '../../../common/types';
import { pocketbaseCollectionOutputSchema } from '../../../output-schemas';

export const updateCollectionAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_update_collection',
  outputSchema: pocketbaseCollectionOutputSchema,
  displayName: 'Update Collection',
  description: 'Renames a collection, adds fields, or changes its rules and options.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Changes a collection; only the inputs you set are sent. Add Fields appends new fields and keeps the existing ones. To change or remove existing fields, pass the complete "fields" array in Additional Fields: any field missing from it is deleted with its data, so read the current fields with Get Collection first.',
    idempotent: false,
  },
  props: {
    collection: pocketbaseAiProps.collection({ required: true }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'New collection name. Leave empty to keep the current name.',
      required: false,
    }),
    addFields: Property.Json({
      displayName: 'Add Fields',
      description: 'Array of new field definitions to append, e.g. [{ "name": "summary", "type": "text" }]. Existing fields are kept.',
      required: false,
    }),
    viewQuery: Property.LongText({
      displayName: 'View Query',
      description: 'New SQL SELECT for a view collection.',
      required: false,
    }),
    rules: Property.Json({
      displayName: 'API Rules',
      description: 'Object with any of listRule, viewRule, createRule, updateRule, deleteRule to change. A filter string limits access, "" allows everyone, null means superusers only.',
      required: false,
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Other collection options sent as-is, e.g. { "indexes": [...] }. A "fields" array here replaces the whole field list.',
      required: false,
    }),
  },
  async run(context) {
    const { collection, name, addFields, viewQuery, rules, additionalFields } = context.propsValue;
    if (addFields !== undefined && !Array.isArray(addFields)) {
      throw new Error('addFields must be an array of field definitions.');
    }
    if (addFields && additionalFields && 'fields' in additionalFields) {
      throw new Error('Set either addFields or a "fields" array in additionalFields, not both.');
    }
    const path = `/api/collections/${encodeURIComponent(collection)}`;
    const fields = addFields && addFields.length > 0 ? [...(await pocketbaseClient.request<PocketbaseCollection>({ auth: context.auth, method: HttpMethod.GET, path })).fields, ...addFields] : undefined;
    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path,
      body: { ...additionalFields, ...rules, name, viewQuery, ...(fields ? { fields } : {}) },
    });
  },
});
