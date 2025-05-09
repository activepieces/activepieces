import { zohoMailAuth } from '../../index';
import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ZOHO_MAIL_API_URL, fetchAccounts } from '../common';

export const markEmailAsRead = createAction({
  auth: zohoMailAuth,
  name: 'mark_email_as_read',
  displayName: 'Mark Email(s) as Read',
  description: 'Mark one or more emails/threads as read.',
  props: {
    accountId: Property.Dropdown({
      displayName: 'Account ID',
      description: 'Select the Zoho Mail Account ID.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, placeholder: 'Please authenticate first', options: [] };
        const accounts = await fetchAccounts(auth as OAuth2PropertyValue);
        if (accounts.length === 0) return { disabled: true, placeholder: 'No accounts found', options: [] };
        return { disabled: false, options: accounts };
      },
    }),
    messageIds: Property.Array({
        displayName: 'Message IDs',
        description: 'Array of Message IDs to mark as read. Provide either Message IDs or Thread IDs.',
        required: false,
    }),
    threadIds: Property.Array({
        displayName: 'Thread IDs',
        description: 'Array of Thread IDs to mark as read. Provide either Message IDs or Thread IDs.',
        required: false,
    }),
  },
  async run(context) {
    const { accountId, messageIds, threadIds } = context.propsValue;
    const accessToken = context.auth.access_token;

    const finalMessageIds = messageIds as string[] | undefined;
    const finalThreadIds = threadIds as string[] | undefined;

    if ((!finalMessageIds || finalMessageIds.length === 0) && (!finalThreadIds || finalThreadIds.length === 0)) {
        throw new Error('Provide at least one Message ID or Thread ID.');
    }

    const requestBody: Record<string, unknown> = {
      mode: 'markAsRead',
    };

    if (finalMessageIds && finalMessageIds.length > 0) {
      requestBody['messageId'] = finalMessageIds;
    }
    if (finalThreadIds && finalThreadIds.length > 0) {
      requestBody['threadId'] = finalThreadIds;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${ZOHO_MAIL_API_URL}/accounts/${accountId}/updatemessage`,
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    return response.body;
  },
});
