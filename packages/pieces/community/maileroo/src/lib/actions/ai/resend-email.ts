import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooResendEmailOutputSchema } from '../../output-schemas';

export const mailerooResendEmail = createAction({
  auth: mailerooAuth,
  name: 'maileroo_resend_email',
  outputSchema: mailerooResendEmailOutputSchema,
  displayName: 'Resend Email',
  description: 'Requeues a previously sent email for another delivery attempt.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Re-sends a stored message as-is under a new reference ID, which is returned. Delivers real mail to the original recipients again, so confirm intent first. Get the message ID from maileroo_search_email_logs. Not idempotent: each call queues another delivery. Requires an Account Key connection.',
    idempotent: false,
  },
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'Message ID from maileroo_search_email_logs.',
      required: true,
    }),
  },
  async run(context) {
    const { message_id } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/logs/email/${encodeURIComponent(message_id)}/resend`,
    });
  },
});
