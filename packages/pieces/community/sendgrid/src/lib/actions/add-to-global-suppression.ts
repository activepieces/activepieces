import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { getApiKey, getBaseUrl, sendgridAuth } from '../common';

export const addToGlobalSuppression = createAction({
  auth: sendgridAuth,
  name: 'add_to_global_suppression',
  displayName: 'Add to Global Unsubscribe List',
  description:
    'Add one or more email addresses to the global suppression list, stopping all future emails to them',
  audience: 'both',
  aiMetadata: {
    description:
      "Adds email addresses to SendGrid's global suppression (unsubscribe) list, blocking every future send to them regardless of list membership. Use to suppress dormant or offboarded recipients; to manage a contact's marketing list membership instead, use Create or Update Contact. Idempotent — repeating the same emails leaves them suppressed.",
    idempotent: true,
  },
  props: {
    emails: Property.Array({
      displayName: 'Emails',
      description: 'Email addresses to add to the global suppression list',
      required: true,
    }),
  },
  async run(context) {
  const recipient_emails = context.propsValue.emails
    .map((email) => String(email).trim())
    .filter((email) => email.length > 0);

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${getBaseUrl(context.auth)}/asm/suppressions/global`,
      body: { recipient_emails },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: getApiKey(context.auth),
      },
    });

    return { success: true };
  },
});
