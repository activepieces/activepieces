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
  description: 'Finds records in database.',
  props: {
    space_id: BikaCommon.space_id,
    database_id: BikaCommon.database_id,
    maxRecords: Property.Number({
      displayName: 'Max Records',
      description: 'How many records are returned in total.',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'How many records are returned per page (max 1000).',
      required: false,
    }),
    filter: Property.LongText({
      displayName: 'Filter',
      description:
        'The filter to apply to the records (see https://bika.ai/help/guide/developer/filter-query-language).',
      required: false,
    }),
  },
  async run(context) {
    const databaseId = context.propsValue.database_id;
    const spaceId = context.propsValue.space_id;
    const maxRecords = context.propsValue.maxRecords;
    const pageSize = context.propsValue.pageSize ?? 100;
    const filter = context.propsValue.filter;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof BikaAuth>
    );
    const response: any = await client.listRecords(
      spaceId,
      databaseId,
      prepareQuery({
        pageSize,
        maxRecords,
        filter,
      })
    );

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }
    return response;
  },
});
