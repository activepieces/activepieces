import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { BaserowFieldType } from '../common/constants';
import { BaserowField } from '../common/types';
import { ensureSelectOptionsExist, makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { upsertRowOutputSchema } from '../output-schemas';

export const upsertRowAiAction = createAction({
  name: 'baserow_upsert_row_ai',
  classification: 'WRITE',
  outputSchema: upsertRowOutputSchema,
  displayName: 'Upsert Row',
  description: 'Updates the row matching a key field value, or creates it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up the first row whose match field equals the match value; updates it with the given fields if found, otherwise creates a new row with those fields plus the match value (the match value always wins over the same field in Fields). Use to sync records by a unique key (email, external ID) without duplicates. Idempotent only when the match value is unique in the table — the lookup and write are separate calls, so concurrent calls can still create two rows.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    match_field: Property.ShortText({
      displayName: 'Match Field Name',
      description: 'Exact name of the key field to match on. Must be a writable text, long text, number, rating, boolean, email, URL, phone number or single select field.',
      required: true,
    }),
    match_value: Property.ShortText({
      displayName: 'Match Value',
      description: 'The key value to look for. For a single select field, pass the option name or its option ID.',
      required: true,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description:
        'JSON object of field name to value to write on the matched or new row. Formats match Create Row. The match field is not changed on an existing row.',
      required: true,
    }),
    create_missing_select_options: Property.Checkbox({
      displayName: 'Create Missing Select Options',
      description:
        'Adds single/multiple select values that do not exist yet as new options before writing. Requires an Email & Password connection.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { table_id, match_field, match_value, fields, create_missing_select_options } =
      context.propsValue;
    baserowAiHelpers.assertSelectOptionsAllowed({
      auth: context.auth,
      createMissingSelectOptions: create_missing_select_options,
    });
    const payload = baserowAiHelpers.toRecord({ value: fields, propName: 'Fields' });
    const client = await makeClient(context.auth);
    return await baserowAiHelpers.execute(async () => {
      const tableFields = await client.listTableFields(table_id);
      const matchField = tableFields.find((f) => f.name === match_field);
      if (!matchField) {
        throw new Error(
          `Field "${match_field}" was not found in table ${table_id}. Available fields: ${tableFields.map((f) => f.name).join(', ')}.`
        );
      }
      if (!isMatchableField({ field: matchField })) {
        throw new Error(
          `Field "${match_field}" (${matchField.type}${matchField.read_only ? ', read-only' : ''}) cannot be used as a match field. Use a writable text, long text, number, rating, boolean, email, URL, phone number or single select field. Matchable fields: ${tableFields.filter((f) => isMatchableField({ field: f })).map((f) => f.name).join(', ')}.`
        );
      }
      const matchFilter = buildMatchFilter({ field: matchField, value: match_value });
      const existingRow = matchFilter
        ? (await client.queryRows({ tableId: table_id, query: { size: '1', ...matchFilter } })).results[0]
        : undefined;
      const rowPayload = existingRow
        ? Object.fromEntries(Object.entries(payload).filter(([key]) => key !== matchField.name))
        : { ...payload, [matchField.name]: toCreateValue({ field: matchField, value: match_value }) };
      if (create_missing_select_options) {
        await ensureSelectOptionsExist({ fields: tableFields, payload: rowPayload, client });
      }
      if (existingRow) {
        const row = await client.updateRow(table_id, existingRow.id, rowPayload);
        return { action: 'updated', row };
      }
      const row = await client.createRow(table_id, rowPayload);
      return { action: 'created', row };
    });
  },
});

function isMatchableField({ field }: { field: BaserowField }): boolean {
  const unsupportedTypes: string[] = [
    BaserowFieldType.LINK_TO_TABLE,
    BaserowFieldType.MULTI_SELECT,
    BaserowFieldType.MULTIPLE_COLLABORATORS,
    BaserowFieldType.FILE,
    BaserowFieldType.ROLLUP,
    BaserowFieldType.LOOKUP,
    BaserowFieldType.COUNT,
    BaserowFieldType.LAST_MODIFIED_BY,
    BaserowFieldType.CREATED_BY,
    BaserowFieldType.DATE,
    BaserowFieldType.LAST_MODIFIED,
    BaserowFieldType.CREATED_ON,
    BaserowFieldType.DURATION,
    BaserowFieldType.UUID,
    BaserowFieldType.AUTO_NUMBER,
  ];
  return !field.read_only && !unsupportedTypes.includes(field.type);
}

function buildMatchFilter({ field, value }: { field: BaserowField; value: string }): Record<string, string> | null {
  if (field.type !== BaserowFieldType.SINGLE_SELECT) {
    return { [`filter__field_${field.id}__equal`]: value };
  }
  const option = findSelectOption({ field, value });
  return option ? { [`filter__field_${field.id}__single_select_equal`]: String(option.id) } : null;
}

function toCreateValue({ field, value }: { field: BaserowField; value: string }): string | number {
  if (field.type !== BaserowFieldType.SINGLE_SELECT) {
    return value;
  }
  return findSelectOption({ field, value })?.id ?? value;
}

function findSelectOption({ field, value }: { field: BaserowField; value: string }): { id: number; value: string } | undefined {
  if (field.type !== BaserowFieldType.SINGLE_SELECT) {
    return undefined;
  }
  return field.select_options.find((o) => o.value === value || String(o.id) === value.trim());
}
