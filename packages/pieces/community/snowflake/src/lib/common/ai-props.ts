import { Property } from '@activepieces/pieces-framework';
import { FILTER_OPERATORS } from './sql';

export const aiProps = {
  table: (description?: string) =>
    Property.ShortText({
      displayName: 'Table',
      description:
        description ??
        'Table name, optionally qualified as DATABASE.SCHEMA.TABLE (e.g. `ANALYTICS.PUBLIC.ORDERS`). An unqualified name uses the connection default database and schema. Unquoted names are case-insensitive; wrap a name in double quotes for exact case.',
      required: true,
    }),
  database: (required: boolean) =>
    Property.ShortText({
      displayName: 'Database',
      description: required
        ? 'Database name, as returned by List Databases.'
        : 'Database name, as returned by List Databases. Leave empty to use the connection default.',
      required,
    }),
  schema: (required: boolean) =>
    Property.ShortText({
      displayName: 'Schema',
      description: required
        ? 'Schema name, optionally qualified as DATABASE.SCHEMA (e.g. `ANALYTICS.PUBLIC`).'
        : 'Schema name, optionally qualified as DATABASE.SCHEMA (e.g. `ANALYTICS.PUBLIC`). Leave empty to use the connection default.',
      required,
    }),
  namePattern: Property.ShortText({
    displayName: 'Name Pattern',
    description:
      'Optional case-insensitive SQL LIKE pattern on the name, e.g. `%ORDER%`. Leave empty to list all.',
    required: false,
  }),
  limit: (defaultValue: number, max: number) =>
    Property.Number({
      displayName: 'Limit',
      description: `Maximum number of items to return (1–${max}). Defaults to ${defaultValue}.`,
      required: false,
      defaultValue,
    }),
  filters: (required: boolean) =>
    Property.Array({
      displayName: 'Filters',
      description: `Conditions combined with AND. Each has a column, an operator (${FILTER_OPERATORS.join(
        ', '
      )}) and a value. For IN / NOT IN pass a list or comma-separated values; IS NULL / IS NOT NULL take no value.${
        required ? ' At least one filter is required.' : ''
      }`,
      required,
      properties: {
        column: Property.ShortText({ displayName: 'Column', required: true }),
        operator: Property.StaticDropdown({
          displayName: 'Operator',
          required: true,
          defaultValue: '=',
          options: {
            options: FILTER_OPERATORS.map((operator) => ({
              label: operator,
              value: operator,
            })),
          },
        }),
        value: Property.ShortText({ displayName: 'Value', required: false }),
      },
    }),
  values: (displayName: string, description: string) =>
    Property.Json({
      displayName,
      description,
      required: true,
    }),
};

export const READ_DEFAULT_LIMIT = 100;
export const READ_MAX_LIMIT = 1000;
export const WRITE_GUARD_DEFAULT = 100;
export const WRITE_GUARD_MAX = 10000;
