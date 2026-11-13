import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseCollectionOutputSchema } from '../../../output-schemas';

const TYPE_OPTIONS = [
  { label: 'Base', value: 'base' },
  { label: 'Auth', value: 'auth' },
  { label: 'View', value: 'view' },
];

export const createCollectionAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_create_collection',
  outputSchema: pocketbaseCollectionOutputSchema,
  displayName: 'Create Collection',
  description: 'Creates a base, auth or view collection.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a collection. A base or auth collection takes its Fields; a view collection takes a View Query instead and derives its fields from it (test the query first with Preview View Query). API rules default to superusers only.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Unique collection name, e.g. "posts".',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'base stores records, auth stores users that can sign in, view is a read-only SQL view. Defaults to base.',
      required: false,
      options: { options: TYPE_OPTIONS },
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'Array of field definitions, e.g. [{ "name": "title", "type": "text", "required": true }, { "name": "views", "type": "number" }]. Types: text, editor, number, bool, email, url, date, autodate, select, file, relation, json, geoPoint, password.',
      required: false,
    }),
    viewQuery: Property.LongText({
      displayName: 'View Query',
      description: 'SQL SELECT for a view collection; must return an "id" column. Required when Type is view.',
      required: false,
    }),
    rules: Property.Json({
      displayName: 'API Rules',
      description: 'Object with any of listRule, viewRule, createRule, updateRule, deleteRule. A filter string limits access, "" allows everyone, null means superusers only (the default).',
      required: false,
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Other collection options sent as-is, e.g. { "indexes": ["CREATE INDEX idx_title ON posts (title)"] } or auth options like passwordAuth and oauth2.',
      required: false,
    }),
  },
  async run(context) {
    const { name, type, fields, viewQuery, rules, additionalFields } = context.propsValue;
    if (type && !TYPE_OPTIONS.some((option) => option.value === type)) {
      throw new Error(`type must be one of ${TYPE_OPTIONS.map((option) => option.value).join(', ')}.`);
    }
    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/collections',
      body: { ...additionalFields, ...rules, name, type, fields, viewQuery },
    });
  },
});
