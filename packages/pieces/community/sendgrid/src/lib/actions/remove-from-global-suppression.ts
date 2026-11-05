import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { getApiKey, getBaseUrl, sendgridAuth } from '../common';

export const removeFromGlobalSuppression = createAction({
  auth: sendgridAuth,
  name: 'remove_from_global_suppression',
  classification: 'WRITE',
  displayName: 'Remove from Global Unsubscribe List',
  description: 'Let an address receive your emails again',
  audience: 'both',
  aiMetadata: {
    description:
      "Removes an email address from SendGrid's global suppression (unsubscribe) list, re-enabling delivery to it. Use when reactivating a previously offboarded or dormant recipient. Idempotent — the end state is the email removed from the list.",
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'This address can get email from your account again.',
      placeholder: 'jane@example.com',
      required: true,
    }),
  },
  async run(context) {
    const email = context.propsValue.email.trim();

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${getBaseUrl(context.auth)}/asm/suppressions/global/${encodeURIComponent(
        email
      )}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: getApiKey(context.auth),
      },
    });

    return { success: true };
  },
});
