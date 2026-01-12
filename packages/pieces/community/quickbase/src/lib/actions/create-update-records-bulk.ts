import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbaseAuth } from '../../index';
import { appIdProp, tableIdProp, mergeFieldProp } from '../common/props';
import { QuickbaseClient } from '../common/client';
import { QuickbaseCreateRecordResponse, QuickbaseField } from '../common/types';
import {
  mapFieldsToRecord,
  chunkArray,
  validateRequiredFields,
} from '../common/utils';

export const createUpdateRecordsBulk = createAction({
  name: 'create_update_records_bulk',
  displayName: 'Create / Update Records From Array',
  description: 'Bulk create or update multiple records based on a merge key',
  auth: quickbaseAuth,
  props: {
    appId: appIdProp,
    tableId: tableIdProp,
    mergeField: mergeFieldProp,
    records: Property.Array({
      displayName: 'Records',
      description: 'Array of records to create or update',
      required: true,
    }),
    mergeFieldBehavior: Property.StaticDropdown({
      displayName: 'Merge Behavior',
      description: 'How to handle existing records when upserting',
      required: true,
      defaultValue: 'merge-overwrite',
      options: {
        options: [
          {
            label: 'Merge and overwrite all fields',
            value: 'merge-overwrite',
          },
          {
            label: 'Merge and update only provided fields',
            value: 'merge-update',
          },
          {
            label: 'Always create new records (no merge)',
            value: 'always-create',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { appId, tableId, mergeField, records, mergeFieldBehavior } =
      context.propsValue;
    const client = new QuickbaseClient(context.auth.props.realmHostname, context.auth.props.userToken);

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('Records array is required and cannot be empty');
    }

    const tableFields = await client.get<QuickbaseField[]>(
      `/fields?tableId=${tableId}`
    );
    const requiredFields = tableFields
      .filter((f) => f.required)
      .map((f) => f.id.toString());

    const processedRecords = records.map((record) => {
      if (mergeFieldBehavior !== 'always-create') {
        validateRequiredFields(record as Record<string, any>, requiredFields);
      }
      return mapFieldsToRecord(record as Record<string, any>, tableFields);
    });

    const chunks = chunkArray(processedRecords, 1000);
    const results = {
      createdRecords: [] as number[],
      updatedRecords: [] as number[],
      unchangedRecords: [] as number[],
      totalProcessed: 0,
      success: true,
    };

    for (const chunk of chunks) {
      const requestData: any = {
        to: tableId,
        data: chunk,
        fieldsToReturn: tableFields.map((f) => f.id),
      };

      if (mergeFieldBehavior !== 'always-create') {
        requestData.mergeFieldId = parseInt(mergeField);
        requestData.upsert =
          mergeFieldBehavior === 'merge-overwrite' ? 'true' : 'false';
      }

      const response = await client.post<QuickbaseCreateRecordResponse>(
        '/records',
        requestData
      );

      results.createdRecords.push(...response.metadata.createdRecordIds);
      results.updatedRecords.push(...response.metadata.updatedRecordIds);
      results.unchangedRecords.push(...response.metadata.unchangedRecordIds);
      results.totalProcessed += response.metadata.totalNumberOfRecordsProcessed;
    }

    return results;
  },
});
