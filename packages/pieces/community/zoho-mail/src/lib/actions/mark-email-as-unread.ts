import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { zohoMailAuth } from "../../index";
import { zohoMailCommon } from "../common";

export const markEmailAsUnread = createAction({
  name: 'mark_email_as_unread',
  displayName: 'Mark Email as Unread',
  description: 'Mark one or more emails/threads as unread',
  auth: zohoMailAuth,
  props: {
    accountId: zohoMailCommon.accountIdProperty,
    messageIds: Property.Array({
      displayName: 'Message IDs',
      description: 'The IDs of the messages to mark as unread. Provide either Message IDs or Thread IDs.',
      required: false,
    }),
    threadIds: Property.Array({
      displayName: 'Thread IDs',
      description: 'The IDs of the threads to mark as unread. Provide either Message IDs or Thread IDs.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { accountId: accountIdProp, messageIds, threadIds } = propsValue;

    // Use provided account ID or get the default one
    const accountId = accountIdProp || await zohoMailCommon.getAccountId(auth);

    const finalMessageIds = messageIds as string[] | undefined;
    const finalThreadIds = threadIds as string[] | undefined;

    if ((!finalMessageIds || finalMessageIds.length === 0) && (!finalThreadIds || finalThreadIds.length === 0)) {
      throw new Error('Provide at least one Message ID or Thread ID.');
    }

    const requestBody: Record<string, unknown> = {
      mode: 'markAsUnread',
    };

    if (finalMessageIds && finalMessageIds.length > 0) {
      requestBody.messageId = finalMessageIds;
    }

    if (finalThreadIds && finalThreadIds.length > 0) {
      requestBody.threadId = finalThreadIds;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${zohoMailCommon.baseUrl}/accounts/${accountId}/updatemessage`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to mark email as unread: ${JSON.stringify(response.body)}`);
    }

    return response.body;
  },
});
