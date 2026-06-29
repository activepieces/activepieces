import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { airtableAuth } from '../auth';
import { AirtableField } from '../common/models';

export const airtableUpdateFieldAction = createAction({
  auth: airtableAuth,
  name: 'update_field',
  displayName: 'Update Field (Agent)',
  description: "Rename or re-describe a field (column).",
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames a field and/or changes its description. Airtable does NOT allow changing a field\'s type or options via the API — only name and description are editable. Supply at least one of name or description. Note this endpoint requires the table ID (not the table name). Requires a token with the schema.bases:write scope. Idempotent: setting the same values converges to the same state.',
    idempotent: true,
  },
  props: {
    base_id: Property.ShortText({
      displayName: 'Base ID',
      description:
        'The Airtable base ID (e.g. "appXXXXXXXXXXXXXX"). Resolve it with List Bases (Agent).',
      required: true,
    }),
    table_id: Property.ShortText({
      displayName: 'Table ID',
      description:
        'The table ID (e.g. "tblXXXXXXXXXXXXXX") — this endpoint requires the ID, not the name. Resolve it with Get Base Schema (Agent).',
      required: true,
    }),
    field_id: Property.ShortText({
      displayName: 'Field ID',
      description:
        'The field ID (e.g. "fldXXXXXXXXXXXXXX") to update. Resolve it with Get Base Schema (Agent).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'Optional new name for the field.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'New Description',
      description: 'Optional new description for the field.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id, table_id, field_id, name, description } = propsValue;

    if (!name && !description) {
      throw new Error('Supply at least one of New Name or New Description.');
    }

    const body: { name?: string; description?: string } = {};
    if (name) body.name = name;
    if (description) body.description = description;

    const request: HttpRequest = {
      method: HttpMethod.PATCH,
      url: `https://api.airtable.com/v0/meta/bases/${base_id}/tables/${table_id}/fields/${field_id}`,
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
          'Airtable rejected the request (permission). Updating a field requires a token with the schema.bases:write scope.'
        );
      }
      if (status === 404) {
        throw new Error(
          `Base "${base_id}", table "${table_id}", or field "${field_id}" was not found. Verify the IDs with Get Base Schema (Agent) (use the table ID, not its name).`
        );
      }
      if (status === 422) {
        throw new Error(
          'Airtable rejected the update (422). Only name and description are editable — field type and options cannot be changed via the API.'
        );
      }
      if (status === 429) {
        throw new Error('Airtable rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
