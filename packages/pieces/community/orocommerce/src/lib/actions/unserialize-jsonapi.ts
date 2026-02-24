import { createAction, Property } from '@activepieces/pieces-framework';
import { deserialize, type JsonApiDocument } from '../common/jsonapi';

export const unserializeJsonApiAction = createAction({
  name: 'unserialize_jsonapi',
  displayName: 'Unserialize JSON:API Response',
  description:
    'Flattens a JSON:API response body into a plain object (or array of objects). ' +
    'Included relationships are resolved and inlined. Unresolved relationship ' +
    'references are kept as { _type, id } stubs so the document can be ' +
    're-serialized back to a valid JSON:API request without data loss. ' +
    'Pass the "body" output of the API Call action as the Response input.',
  auth: undefined,
  props: {
    response: Property.Json({
      displayName: 'JSON:API Response',
      description:
        'The raw JSON:API response body - the "body" field from the API Call action output. ' +
        'Must contain a top-level "data" key (single resource or collection).',
      required: true,
      defaultValue: {},
    }),
  },

  async run(context) {
    const doc = context.propsValue.response as JsonApiDocument;
    return deserialize(doc);
  },
});
