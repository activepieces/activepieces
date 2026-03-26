import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';

export const sendEmailAction = createAction({
  name: 'send_email',
  displayName: 'Send Email',
  description:
    'Sends an email to a lead via your configured email integration.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to email',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'HTML email body',
      required: true,
    }),
    fromName: Property.ShortText({
      displayName: 'From Name',
      description: 'Sender display name',
      required: false,
    }),
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('communications/send-email', {
      leadId: context.propsValue.leadId,
      subject: context.propsValue.subject,
      body: context.propsValue.body,
      fromName: context.propsValue.fromName,
    });
  },
});
