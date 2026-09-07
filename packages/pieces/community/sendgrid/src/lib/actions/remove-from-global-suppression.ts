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
  displayName: 'Remove from Global Unsubscribe List',
  description:
    'Remove an email address from the global suppression list, allowing it to receive emails again',
  audience: 'both',
  aiMetadata: {
    description:
      "Removes an email address from SendGrid's global suppression (unsubscribe) list, re-enabling delivery to it. Use when reactivating a previously offboarded or dormant recipient. Idempotent — the end state is the email removed from the list.",
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to remove from the global suppression list',
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
