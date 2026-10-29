import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId } from '../common/props';
import { suppressEmailsOutputSchema } from '../output-schemas';

export const suppressEmailsAction = createAction({
  auth: campaignMonitorAuth,
  name: 'suppress_emails',
  classification: 'WRITE',
  displayName: 'Add Emails to Suppression List',
  description: 'Stops a client from sending to the given email addresses.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds one or more email addresses to a Campaign Monitor client suppression list, so no campaign from that client is sent to them; their subscriber records stay in place. Reverse with Remove Email from Suppression List. Idempotent: suppressing an address that is already suppressed changes nothing.',
    idempotent: true,
  },
  outputSchema: suppressEmailsOutputSchema,
  props: {
    clientId: clientId,
    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'Addresses to add to the suppression list.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const emails = propsValue.emails
      .map((email) => String(email).trim())
      .filter((email) => email.length > 0);
    if (emails.length === 0) {
      throw new Error('Provide at least one email address.');
    }
    await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.POST,
      path: `/clients/${propsValue.clientId}/suppress.json`,
      body: { EmailAddresses: emails },
    });
    return {
      success: true,
      emailAddresses: emails,
    };
  },
});
