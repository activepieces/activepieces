import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { BikaCommon, makeClient } from '../common';
import { BikaAuth } from '../../index';

export const findRecordAction = createAction({
  auth: BikaAuth,
  name: 'bika_find_record',
  displayName: 'Find a Record by ID',
  description: 'Finds a record in datasheet by ID.',
  props: {
    space_id: BikaCommon.space_id,
    datasheet_id: BikaCommon.datasheet_id,
      recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to find.',
      required: true,
    }),
  },
  async run(context) {
    const datasheetId = context.propsValue.datasheet_id;
    const spaceId = context.propsValue.space_id;
    const recordId = context.propsValue.recordId;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof BikaAuth>
    );

    const response: any = await client.findRecord(
      spaceId,
      datasheetId,
      recordId,
    );

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }
    return response;
  },
});
