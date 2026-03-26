import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const sendSmsAction = createAction({
  name: 'send_sms',
  displayName: 'Send SMS',
  description:
    'Sends an SMS to a lead via your configured Twilio integration.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'SMS message (max 160 chars)',
      required: true,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('communications/send-sms', {
      leadId: context.propsValue.leadId,
      message: context.propsValue.message,
    });
  },
});
