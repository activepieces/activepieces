import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const queryBatchRedeem = createAction({
  auth: pubrioAuth,
  name: 'query_batch_redeem',
  displayName: 'Query Batch Redeem',
  description: 'Query the status and results of a batch redeem operation',
  props: {
    redeem_query_id: Property.ShortText({
      displayName: 'Redeem Query ID',
      required: true,
      description: 'The batch redeem query ID',
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      redeem_query_id: context.propsValue.redeem_query_id,
    };
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/redeem/people/batch/query',
      body
    );
  },
});
