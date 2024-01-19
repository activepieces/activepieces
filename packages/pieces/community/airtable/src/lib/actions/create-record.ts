import {
  DynamicPropsValue,
  createAction,
} from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { airtableAuth } from '../../index';

export const airtableCreateRecordAction = createAction({
  auth: airtableAuth,
  name: 'airtable_create_record',
  displayName: 'Create Airtable Record',
  description: 'Adds a record into an airtable',
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    fields: airtableCommon.fields,
  },
  async run(context) {
    const personalToken = context.auth;
    const { base: baseId, tableId, fields } = context.propsValue;
    const fieldsWithoutEmptyStrings: DynamicPropsValue = {};

    Object.keys(fields).forEach((k) => {
      if (fields[k] !== '') {
        fieldsWithoutEmptyStrings[k] = fields[k];
      }
    });
    const newFields: Record<string, unknown> =
      await airtableCommon.createNewFields(
        personalToken,
        baseId,
        tableId as string,
        fieldsWithoutEmptyStrings
      );

    return airtableCommon.createRecord({
      personalToken,
      baseId,
      tableId: tableId as string,
      fields: newFields,
    });
  },
});
