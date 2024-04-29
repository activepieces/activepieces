import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { APITableCommon, makeClient } from '../common';
import { APITableAuth } from '../../index';
import { prepareQuery } from '../common/client';

export const findRecordAction = createAction({
  auth: APITableAuth,
  name: 'apitable_find_record',
  displayName: 'Find Records',
  description: 'Finds records in datasheet.',
  props: {
    space_id: APITableCommon.space_id,
    datasheet_id: APITableCommon.datasheet_id,
    recordIds: Property.Array({
      displayName: 'Record IDs',
      description: 'The IDs of the records to find.',
      required: false,
    }),
    fieldNames: Property.Array({
      displayName: 'Field Names',
      description:
        'The returned record results are limited to the specified fields',
      required: false,
    }),
    maxRecords: Property.Number({
      displayName: 'Max Records',
      description: 'How many records are returned in total',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'How many records are returned per page (max 1000)',
      required: false,
    }),
    pageNum: Property.Number({
      displayName: 'Page Number',
      description: 'Specifies the page number of the page',
      required: false,
    }),
    filter: Property.LongText({
      displayName: 'Filter',
      description:
        'The filter to apply to the records (see https://help.aitable.ai/docs/guide/manual-formula-field-overview/)',
      required: false,
    }),
  },
  async run(context) {
    const datasheetId = context.propsValue.datasheet_id;
    const recordIds = context.propsValue.recordIds as string[];
    const fieldNames = context.propsValue.fieldNames as string[];
    const maxRecords = context.propsValue.maxRecords;
    const pageSize = context.propsValue.pageSize ?? 100;
    const pageNum = context.propsValue.pageNum ?? 1;
    const filter = context.propsValue.filter;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof APITableAuth>
    );
    const response: any = await client.listRecords(
      datasheetId as string,
      prepareQuery({
        pageSize: pageSize,
        pageNum: pageNum,
        recordIds: recordIds.join(','),
        fieldNames: fieldNames.join(','),
        maxRecords: maxRecords,
        filterByFormula: filter,
      })
    );

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }
    return response;
  },
});
