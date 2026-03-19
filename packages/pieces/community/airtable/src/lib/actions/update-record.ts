import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';

import { airtableCommon } from '../common';
import { airtableAuth } from '../auth';

export const airtableUpdateRecordAction = createAction({
  auth: airtableAuth,
  name: 'airtable_update_record',
  displayName: 'Update Airtable Record',
  description: 'Update a record in airtable',
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordId,
    fields: airtableCommon.fields,
  },
  async run(context) {
    const personalToken = context.auth;
    const { base: baseId, tableId, recordId, fields } = context.propsValue;

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
    const updatedFields: Record<string, unknown> =
      await airtableCommon.createNewFields(
        personalToken.secret_text,
        baseId,
        tableId as string,
        fieldsWithoutEmptyValues
      );

    return await airtableCommon.updateRecord({
      personalToken: personalToken.secret_text,
      baseId: baseId as string,
      tableId: tableId as string,
      recordId: recordId as string,
      fields: updatedFields as Record<string, unknown>,
    });
  },
});
