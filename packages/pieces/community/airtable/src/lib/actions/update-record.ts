import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';

import { airtableCommon } from '../common';
import { airtableAuth } from '../../index';

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

    const fieldsWithoutEmptyStrings: DynamicPropsValue = {};

    Object.keys(fields).forEach((k) => {
      if (fields[k] !== '') {
        fieldsWithoutEmptyStrings[k] = fields[k];
      }
    });
    const updatedFields: Record<string, unknown> =
      await airtableCommon.createNewFields(
        personalToken,
        baseId,
        tableId as string,
        fieldsWithoutEmptyStrings
      );

    return await airtableCommon.updateRecord({
      personalToken,
      baseId: baseId as string,
      tableId: tableId as string,
      recordId: recordId as string,
      fields: updatedFields as Record<string, unknown>,
    });
  },
});
