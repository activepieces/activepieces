import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { pushoverApiCall } from '../common';
import { getReceiptStatusOutputSchema } from '../output-schemas';

export const getReceiptStatus = createAction({
  auth: pushoverAuth,
  name: 'get_receipt_status',
  classification: 'READ',
  displayName: 'Get Emergency Receipt Status',
  description: 'Read the acknowledgement status of an emergency notification receipt',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read whether an emergency (priority 2) notification has been acknowledged, and whether its retries have expired. The receipt comes from Send Push Message sent at priority 2; no other priority produces one. This is a single read, not a wait loop: re-call it at most once every 5 seconds until acknowledged is 1 or expired is 1. Receipts stay valid for up to one week and older ids return an error. Safe to retry.',
    idempotent: true,
  },
  props: {
    receipt: Property.ShortText({
      displayName: 'Receipt',
      description:
        'Receipt id returned by Send Push Message at emergency priority, for example rXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.',
      required: true,
    }),
  },
  outputSchema: getReceiptStatusOutputSchema,
  async run({ auth, propsValue }) {
    return await pushoverApiCall({
      method: HttpMethod.GET,
      resourceUri: `/receipts/${propsValue.receipt}.json`,
      queryParams: { token: auth.props.api_token },
      errorHint:
        'Receipts expire after about one week and only exist for priority 2 notifications.',
    });
  },
});
