import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dealportAuth } from '../auth';
import { assertValidRecordId, dealportRequest } from '../common/client';

export const getRecordAction = createAction({
  auth: dealportAuth,
  name: 'get-record',
  displayName: 'Get Cited Record',
  description:
    'Open a cited Dealport company Record (UUID) or NYC building Record (10-digit BBL) with primary public-filing sources ($0.01 per new Record).',
  props: {
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description: 'Dealport company UUID or 10-digit NYC property BBL.',
      required: true,
    }),
  },
  async run(context) {
    const recordId = assertValidRecordId(context.propsValue.record_id);
    return await dealportRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/records/${encodeURIComponent(recordId)}`,
    });
  },
});
