import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { BikaCommon, makeClient } from '../common';
import { BikaAuth } from '../../index';
import { prepareQuery } from '../common/client';

export const findRecordsAction = createAction({
  auth: BikaAuth,
  name: 'bika_find_records',
  displayName: 'Find Records',
  description: 'Finds records in datasheet.',
  props: {
    space_id: BikaCommon.space_id,
    datasheet_id: BikaCommon.datasheet_id,
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
        'The filter to apply to the records (see https://bika.ai/help/guide/developer/filter-query-language)',
      required: false,
    }),
  },
  async run(context) {
    const datasheetId = context.propsValue.datasheet_id;
    const spaceId = context.propsValue.space_id;
    const maxRecords = context.propsValue.maxRecords;
    const pageSize = context.propsValue.pageSize ?? 100;
    const pageNum = context.propsValue.pageNum ?? 1;
    const filter = context.propsValue.filter;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof BikaAuth>
    );
    const response: any = await client.listRecords(
      spaceId,
      datasheetId,
      prepareQuery({
        pageSize: pageSize,
        pageNum: pageNum,
        maxRecords: maxRecords,
        filter ,
      })
    );

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }
    return response;
  },
});
