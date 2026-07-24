import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { airtableAuth } from '../auth';
import { AirtableField } from '../common/models';
import { createFieldActionOutputSchema } from '../output-schemas';

export const airtableCreateFieldAction = createAction({
  auth: airtableAuth,
  name: 'create_field',
  displayName: 'Create Field (Agent)',
  description: 'Add a new field (column) to a table.',
  audience: 'ai',
  outputSchema: createFieldActionOutputSchema,
  aiMetadata: {
    description:
      'Adds a new field (column) to a table. The type must be a valid Airtable field type (e.g. singleLineText, number, singleSelect, multipleSelects, date, checkbox); select-type fields require an options object with choices. Requires a token with the schema.bases:write scope. Not idempotent — each call creates a new field.',
    idempotent: false,
  },
  props: {
    base_id: Property.ShortText({
      displayName: 'Base ID',
      description:
        'The Airtable base ID (e.g. "appXXXXXXXXXXXXXX"). Resolve it with List Bases (Agent).',
      required: true,
    }),
    table_id_or_name: Property.ShortText({
      displayName: 'Table ID or Name',
      description:
        'The table ID (e.g. "tblXXXXXXXXXXXXXX") or its exact name. Resolve it with Get Base Schema (Agent).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Field Name',
      description: 'The name for the new field.',
      required: true,
    }),
    type: Property.ShortText({
      displayName: 'Field Type',
      description:
        'A valid Airtable field type, e.g. "singleLineText", "number", "singleSelect", "multipleSelects", "date", "checkbox", "multipleRecordLinks".',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional description for the field.',
      required: false,
    }),
    options: Property.Json({
      displayName: 'Options',
      description:
        'Type-specific options as JSON. Required for select fields, e.g. {"choices": [{"name": "Todo"}, {"name": "Done"}]}; for number {"precision": 0}. Omit for simple text fields.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id, table_id_or_name, name, type, description, options } =
      propsValue;

    const body: {
      name: string;
      type: string;
      description?: string;
      options?: unknown;
    } = { name, type };
    if (description) body.description = description;
    if (options) body.options = options;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.airtable.com/v0/meta/bases/${base_id}/tables/${encodeURIComponent(
        table_id_or_name
      )}/fields`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
      body,
    };

    try {
      const response = await httpClient.sendRequest<AirtableField>(request);
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Airtable rejected the request (permission). Creating a field requires a token with the schema.bases:write scope.'
        );
      }
      if (status === 404) {
        throw new Error(
          `Base "${base_id}" or table "${table_id_or_name}" was not found. Verify the IDs with List Bases (Agent) and Get Base Schema (Agent).`
        );
      }
      if (status === 422) {
        throw new Error(
          `Airtable rejected the field (422). Check that "${type}" is a valid field type and that any select field includes an options.choices array.`
        );
      }
      if (status === 429) {
        throw new Error('Airtable rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
