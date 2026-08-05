import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { apId, createAction, FieldType, PieceAuth, Property, Table } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';

export const createTable = createAction({
  audience: 'both',
  name: 'tables-create-table',
  displayName: 'Create Table',
  description: 'Create a new table, optionally with fields.',
  aiMetadata: { description: 'Creates a new Activepieces Table in the current project, optionally defining its columns up front - each field takes a name plus a type of text, number, date, or single select, with single-select choices supplied as one comma-separated string. Pick this when a flow needs somewhere to store data that does not exist yet. Only those four column types are supported; not idempotent, since each call creates another table and repeating it with the same name yields duplicates.', idempotent: false },
  auth: PieceAuth.None(),
  props: {
    name: Property.ShortText({
      displayName: 'Table Name',
      required: true,
    }),
    fields: Property.Array({
      displayName: 'Fields',
      description: 'The columns to create. Leave empty to create a table with no fields.',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Field Name',
          required: true,
        }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          defaultValue: FieldType.TEXT,
          options: {
            options: [
              { label: 'Text', value: FieldType.TEXT },
              { label: 'Number', value: FieldType.NUMBER },
              { label: 'Date', value: FieldType.DATE },
              { label: 'Single Select', value: FieldType.STATIC_DROPDOWN },
            ],
          },
        }),
        options: Property.ShortText({
          displayName: 'Options',
          description: 'Comma-separated options, used only when Type is Single Select.',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { name, fields } = context.propsValue;

    const fieldStates = (fields ?? []).map((field) => {
      const { name, type, options } = z.parse(FieldInput, field);
      return {
        name,
        type,
        externalId: apId(),
        data: type === FieldType.STATIC_DROPDOWN ? { options: parseOptions(options) } : null,
      };
    });

    const response = await httpClient.sendRequest<Table>({
      method: HttpMethod.POST,
      url: `${context.server.apiUrl}v1/tables`,
      body: {
        projectId: context.project.id,
        name,
        fields: fieldStates,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
    });

    return {
      ...response.body,
      fields: fieldStates.map(({ name, type, externalId }) => ({ name, type, externalId })),
    };
  },
});

const FieldInput = z.object({
  name: z.string(),
  type: z.enum(FieldType),
  options: z.optional(z.string()),
});

function parseOptions(options: string | undefined): { value: string }[] {
  if (!options) {
    return [];
  }
  return options
    .split(',')
    .map((option) => option.trim())
    .filter((option) => option.length > 0)
    .map((value) => ({ value }));
}
