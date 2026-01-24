import { createAction } from '@activepieces/pieces-framework';
import { quickbaseAuth } from '../../index';
import {
  appIdProp,
  tableIdProp,
  fieldsMapperProp,
  mergeFieldProp,
} from '../common/props';
import { QuickbaseClient } from '../common/client';
import {
  QuickbaseRecordResponse,
  QuickbaseCreateRecordResponse,
  QuickbaseField,
} from '../common/types';
import {
  mapFieldsToRecord,
  extractRecordValues,
  validateRequiredFields,
} from '../common/utils';

export const findOrCreateRecord = createAction({
  name: 'find_or_create_record',
  displayName: 'Find or Create Record',
  description: 'Find an existing record or create a new one if not found',
  auth: quickbaseAuth,
  props: {
    appId: appIdProp,
    tableId: tableIdProp,
    mergeField: mergeFieldProp,
    fields: fieldsMapperProp,
  },
  async run(context) {
    const { appId, tableId, mergeField, fields } = context.propsValue;
    const client = new QuickbaseClient(context.auth.props.realmHostname, context.auth.props.userToken);

    const tableFields = await client.get<QuickbaseField[]>(
      `/fields?tableId=${tableId}`
    );
    const mergeValue =
      fields[mergeField] ||
      fields[
        tableFields.find((f) => f.id.toString() === mergeField)?.label || ''
      ];

    if (!mergeValue) {
      throw new Error(`Merge field value is required`);
    }

    const searchQuery = {
      from: tableId,
      select: tableFields.map((f) => f.id),
      where: `{${mergeField}.EX.'${mergeValue}'}`,
      options: { top: 1 },
    };

    try {
      const searchResponse = await client.post<QuickbaseRecordResponse>(
        '/records/query',
        searchQuery
      );

      if (searchResponse.data.length > 0) {
        const existingRecord = searchResponse.data[0];
        return {
          recordId: existingRecord['3']?.value,
          record: extractRecordValues(existingRecord),
          created: false,
          found: true,
          success: true,
        };
      }
    } catch (error) {
      console.log(error)
    }

    const requiredFields = tableFields
      .filter((f) => f.required)
      .map((f) => f.id.toString());
    validateRequiredFields(fields, requiredFields);

    const recordData = mapFieldsToRecord(fields, tableFields);

    const createResponse = await client.post<QuickbaseCreateRecordResponse>(
      '/records',
      {
        to: tableId,
        data: [recordData],
        fieldsToReturn: tableFields.map((f) => f.id),
      }
    );

    return {
      recordId: createResponse.metadata.createdRecordIds[0],
      record: createResponse.data[0],
      created: true,
      found: false,
      success: true,
    };
  },
});
