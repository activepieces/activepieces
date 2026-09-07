import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { getApiKey, getBaseUrl, sendgridAuth } from '../common';

export const checkGlobalSuppression = createAction({
  auth: sendgridAuth,
  name: 'check_global_suppression',
  displayName: 'Check Global Unsubscribe Status',
  description:
    'Check whether an email address is on the global suppression list',
  audience: 'both',
  aiMetadata: {
    description:
      "Checks whether an email address is currently on SendGrid's global suppression (unsubscribe) list. Use before Remove from Global Unsubscribe List to avoid a no-op call, or to branch a flow based on suppression status. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to check',
      required: true,
    }),
  },
  async run(context) {
    const email = context.propsValue.email.trim();

    const response = await httpClient.sendRequest<{
      recipient_email?: string;
    }>({
      method: HttpMethod.GET,
      url: `${getBaseUrl(context.auth)}/asm/suppressions/global/${encodeURIComponent(
        email
      )}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: getApiKey(context.auth),
      },
    });

    return { email, suppressed: Boolean(response.body.recipient_email) };
  },
});
