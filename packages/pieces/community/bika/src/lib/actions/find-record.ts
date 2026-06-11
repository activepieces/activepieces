import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { BikaCommon, makeClient } from '../common';
import { BikaAuth } from '../auth';

export const findRecordAction = createAction({
  auth: BikaAuth,
  name: 'bika_find_record',
  displayName: 'Get Record',
  description: 'Retrieves a record in database by ID.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves a single record from a Bika.ai database by its record ID. Use when you already know the exact record ID; to search by field values or fetch multiple rows use Find Records instead. Read-only and idempotent.', idempotent: true },
  props: {
    space_id: BikaCommon.space_id,
    database_id: BikaCommon.database_id,
      recordId: Property.ShortText({
      displayName: 'Record ID',
      required: true,
    }),
  },
  async run(context) {
    const databaseId = context.propsValue.database_id;
    const spaceId = context.propsValue.space_id;
    const recordId = context.propsValue.recordId;

    const client = makeClient(
      context.auth.props,
    );

    const response: any = await client.findRecord(
      spaceId,
      databaseId,
      recordId,
    );

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }
    return response;
  },
});
