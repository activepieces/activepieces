import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { zohoMailAuth } from "../../index";
import { zohoMailCommon } from "../common";

export const moveEmailToFolder = createAction({
  name: 'move_email_to_folder',
  displayName: 'Move Email to Folder',
  description: 'Move an email to a different folder',
  auth: zohoMailAuth,
  props: {
    accountId: zohoMailCommon.accountIdProperty,
    messageIds: Property.Array({
      displayName: 'Message IDs',
      description: 'The IDs of the messages to move. Provide either Message IDs or Thread IDs.',
      required: false,
    }),
    threadIds: Property.Array({
      displayName: 'Thread IDs',
      description: 'The IDs of the threads to move. Provide either Message IDs or Thread IDs.',
      required: false,
    }),
    targetFolder: Property.Dropdown({
      displayName: 'Target Folder',
      description: 'The folder to move the email(s) to',
      required: true,
      refreshers: ['accountId'],
      options: async ({ auth, accountId }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        if (!accountId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select an account first',
          };
        }

        try {
          const folders = await zohoMailCommon.fetchFolders(auth, accountId as string);
          if (folders.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No folders found',
            };
          }

          return {
            disabled: false,
            options: folders,
          };
        } catch (error) {
          console.error('Error fetching folders:', error);
          return {
            disabled: true,
            options: [],
            placeholder: 'Error fetching folders',
          };
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { accountId: accountIdProp, messageIds, threadIds, targetFolder } = propsValue;

    // Use provided account ID or get the default one
    const accountId = accountIdProp || await zohoMailCommon.getAccountId(auth);

    const finalMessageIds = messageIds as string[] | undefined;
    const finalThreadIds = threadIds as string[] | undefined;

    if ((!finalMessageIds || finalMessageIds.length === 0) && (!finalThreadIds || finalThreadIds.length === 0)) {
      throw new Error('Provide at least one Message ID or Thread ID.');
    }

    const requestBody: Record<string, unknown> = {
      operation: 'move',
      targetFolderId: targetFolder,
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
      throw new Error(`Failed to move email: ${JSON.stringify(response.body)}`);
    }

    return response.body;
  },
});
