import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooDeleteScheduledEmailOutputSchema } from '../../output-schemas';

export const mailerooDeleteScheduledEmail = createAction({
  auth: mailerooAuth,
  outputSchema: mailerooDeleteScheduledEmailOutputSchema,
  name: 'maileroo_delete_scheduled_email',
  displayName: 'Delete Scheduled Email',
  description: 'Cancels a scheduled email.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Cancels an email that has not been delivered yet, permanently. Get the reference ID from maileroo_send_email (when scheduled) or maileroo_list_scheduled_emails. Requires a Sending Key connection. Hard delete: the email cannot be restored.',
    idempotent: true,
  },
  props: {
    reference_id: Property.ShortText({ displayName: 'Reference ID', description: 'Reference ID of the scheduled email.', required: true }),
  },
  async run(context) {
    const response = await mailerooClient.emailRequest<null>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/emails/scheduled/${encodeURIComponent(context.propsValue.reference_id)}`,
    });
    return { success: response.success, message: response.message };
  },
});
