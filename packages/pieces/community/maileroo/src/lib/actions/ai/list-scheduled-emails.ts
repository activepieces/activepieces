import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooListScheduledEmailsOutputSchema } from '../../output-schemas';

export const mailerooListScheduledEmails = createAction({
  auth: mailerooAuth,
  name: 'maileroo_list_scheduled_emails',
  outputSchema: mailerooListScheduledEmailsOutputSchema,
  displayName: 'List Scheduled Emails',
  description: 'Lists emails scheduled for future delivery.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists emails still waiting to be delivered with their reference ID, sender, recipients, subject, tags and scheduled time. Use the reference ID with maileroo_delete_scheduled_email to cancel one. Domain is optional for domain-scoped sending keys but required for application-scoped keys. Requires a Sending Key connection.',
    idempotent: true,
  },
  props: {
    domain: Property.ShortText({ displayName: 'Domain', description: 'Domain the emails were scheduled from, for example example.com.', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: 'Results per page, at most 100.', required: false }),
  },
  async run(context) {
    const { domain, page, per_page } = context.propsValue;
    const response = await mailerooClient.emailRequest<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/emails/scheduled',
      queryParams: mailerooClient.toQuery({ domain, page, per_page }),
    });
    return response.data;
  },
});
