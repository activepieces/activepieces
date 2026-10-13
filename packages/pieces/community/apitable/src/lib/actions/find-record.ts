import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { APITableCommon, makeClient } from '../common';
import { APITableAuth } from '../auth';
import { prepareQuery } from '../common/client';
import { findRecordActionOutputSchema } from '../output-schemas';

export const findRecordAction = createAction({
  auth: APITableAuth,
  name: 'apitable_find_record',
  classification: 'SEARCH',
  displayName: 'Find Records',
  description: 'Finds records in a datasheet.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads records from an AITable datasheet, optionally narrowing by record IDs, a formula filter, or a field-name projection, with pagination controls; leaving the filters empty returns all records (paged). Use to look up or list datasheet rows before acting on them. Idempotent: it only reads data.',
    idempotent: true,
  },
  props: {
    space_id: APITableCommon.space_id,
    datasheet_id: APITableCommon.datasheet_id,
    filter: Property.LongText({
      displayName: 'Filter Formula',
      description: 'Only records where this formula is true are returned.',
      placeholder: '{Status} = "Done"',
      required: false,
    }),
    recordIds: Property.Array({
      displayName: 'Record IDs',
      description: 'Only return these records. Empty: search all.',
      required: false,
    }),
    fieldNames: Property.Array({
      displayName: 'Fields to Return',
      description: 'Field names to include. Empty: every field.',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Records returned per page.',
      required: false,
      defaultValue: 100,
      display: 'stepper',
      min: 1,
      max: 1000,
      step: 1,
    }),
    maxRecords: Property.Number({
      displayName: 'Max Records',
      description: 'Caps matching records before paging. Empty: no cap.',
      required: false,
      advanced: true,
    }),
    pageNum: Property.Number({
      displayName: 'Page Number',
      description: 'Which page to return, starting at 1.',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: findRecordActionOutputSchema,
  async run(context) {
    const datasheetId = context.propsValue.datasheet_id;
    const recordIds = context.propsValue.recordIds ?? []
    const fieldNames = context.propsValue.fieldNames ?? []
    const maxRecords = context.propsValue.maxRecords;
    const pageSize = context.propsValue.pageSize ?? 100;
    const pageNum = context.propsValue.pageNum ?? 1;
    const filter = context.propsValue.filter;

    const client = makeClient(
      context.auth.props
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
