import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { apId, createAction, FieldType, PieceAuth, Property, Table } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';

export const createTable = createAction({
  audience: 'human',
  name: 'tables-create-table',
  displayName: 'Create Table',
  description: 'Create a new table, optionally with fields.',
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
