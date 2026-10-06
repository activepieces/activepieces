import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { getColumnTypeSchemaActionOutputSchema } from '../../../output-schemas';

export const getColumnTypeSchemaAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_column_type_schema',
  classification: 'READ',
  displayName: 'Get Column Type Schema',
  description: 'Gets the JSON schema of the settings a column type accepts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Return the JSON Schema (draft-07) describing the settings/defaults a monday.com column type accepts, e.g. status labels or dropdown options. Use before Add Board Column with defaults so the payload is valid. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getColumnTypeSchemaActionOutputSchema,
  props: {
    column_type: Property.ShortText({
      displayName: 'Column Type',
      description: 'monday.com column type, e.g. status, dropdown, date, numbers, people, timeline, rating.',
      required: true,
    }),
  },
  async run(context) {
    const columnType = context.propsValue.column_type.trim();

    const data = await makeClient(context.auth).query<{ get_column_type_schema: unknown }>({
      query: `query ($type: ColumnType!) {
        get_column_type_schema(type: $type)
      }`,
      variables: { type: columnType },
    });

    return {
      column_type: columnType,
      schema: JSON.stringify(data.get_column_type_schema),
    };
  },
});
