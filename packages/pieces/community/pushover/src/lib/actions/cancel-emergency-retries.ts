import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { pushoverApiCall } from '../common';
import { cancelEmergencyRetriesOutputSchema } from '../output-schemas';

export const cancelEmergencyRetries = createAction({
  auth: pushoverAuth,
  name: 'cancel_emergency_retries',
  classification: 'WRITE',
  displayName: 'Cancel Emergency Retries',
  description: 'Stop the retry loop of one emergency notification receipt',
  audience: 'ai',
  aiMetadata: {
    description:
      'Stop Pushover from resending one emergency (priority 2) notification, identified by the receipt returned by Send Push Message. Use it once the underlying incident is resolved so the recipient stops being re-alerted; it deletes nothing and already-delivered notifications stay. To stop many notifications at once use Cancel Emergency Retries by Tag. Safe to retry: cancelling an already-cancelled receipt is a no-op.',
    idempotent: true,
  },
  props: {
    receipt: Property.ShortText({
      displayName: 'Receipt',
      description:
        'Receipt id returned by Send Push Message at emergency priority (2).',
      required: true,
    }),
  },
  outputSchema: cancelEmergencyRetriesOutputSchema,
  async run({ auth, propsValue }) {
    return await pushoverApiCall({
      method: HttpMethod.POST,
      resourceUri: `/receipts/${propsValue.receipt}/cancel.json`,
      body: { token: auth.props.api_token },
      errorHint:
        'Receipts expire after about one week and only exist for priority 2 notifications.',
    });
  },
});
