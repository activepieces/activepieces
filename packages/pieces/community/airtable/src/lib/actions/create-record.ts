import {
  DynamicPropsValue,
  createAction,
} from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { airtableAuth } from '../auth';

export const airtableCreateRecordAction = createAction({
  auth: airtableAuth,
  name: 'airtable_create_record',
  displayName: 'Create Airtable Record',
  description: 'Adds a record into an airtable',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new record in an Airtable table from a set of field values, resolving any linked-record/attachment fields before insert. Use to append a row to a base. Requires a base and table; each call appends a distinct record, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    fields: airtableCommon.fields,
  },
  async run(context) {
    const personalToken = context.auth;
    const { base: baseId, tableId, fields } = context.propsValue;
    const fieldsWithoutEmptyValues: DynamicPropsValue = {};

    Object.keys(fields).forEach((k) => {
      const value = fields[k];
      if (value === null || value === undefined || value === '') {
        return;
      }
      if (Array.isArray(value) && value.length === 0) {
        return;
      }
      fieldsWithoutEmptyValues[k] = value;
    });
    const newFields: Record<string, unknown> =
      await airtableCommon.createNewFields(
        personalToken.secret_text,
        baseId,
        tableId as string,
        fieldsWithoutEmptyValues
      );

    return airtableCommon.createRecord({
      personalToken: personalToken.secret_text,
      baseId,
      tableId: tableId as string,
      fields: newFields,
    });
  },
});
