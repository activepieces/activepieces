import { zohoMailAuth } from '../../index';
import { Property, createAction, OAuth2PropertyValue, DynamicPropsValue, InputPropertyMap } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { ZOHO_MAIL_API_URL, fetchAccounts, fetchFolders } from '../common';

export const moveEmail = createAction({
  auth: zohoMailAuth,
  name: 'move_email',
  displayName: 'Move Email to Folder',
  description: 'Move one or more emails/threads to a different folder.',
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
    destfolderId: Property.Dropdown({
      displayName: 'Destination Folder',
      description: 'Select the folder to move the email(s) to.',
      required: true,
      refreshers: ['accountId'],
      options: async ({ auth, accountId }) => {
        if (!auth || !accountId) return { disabled: true, placeholder: 'Select an account first', options: [] };
        const folders = await fetchFolders(auth as OAuth2PropertyValue, accountId as string);
        if (folders.length === 0) return { disabled: true, placeholder: 'No folders found for this account', options: [] };
        return { disabled: false, options: folders };
      },
    }),
    messageIds: Property.Array({
        displayName: 'Message IDs',
        description: 'Array of Message IDs to move. Provide either Message IDs or Thread IDs.',
        required: false,
    }),
    threadIds: Property.Array({
        displayName: 'Thread IDs',
        description: 'Array of Thread IDs to move. Provide either Message IDs or Thread IDs.',
        required: false,
    }),
    isFolderSpecific: Property.Checkbox({
        displayName: 'Is Action Folder Specific?',
        description: 'Specify if the move operation is from a specific folder.',
        required: false,
        defaultValue: false,
    }),
    folderId: Property.DynamicProperties({
        displayName: 'Source Folder',
        refreshers: ['isFolderSpecific', 'accountId'],
        required: true,
        props: async (propsValue): Promise<InputPropertyMap> => {
            const { auth, accountId, isFolderSpecific } = propsValue as DynamicPropsValue & { auth?: OAuth2PropertyValue, accountId?: string, isFolderSpecific?: boolean };
            const currentFolderProps: InputPropertyMap = {};
            if (!isFolderSpecific) return currentFolderProps;

            currentFolderProps['currentFolderId'] = Property.Dropdown({
                displayName: 'Source Folder',
                description: 'Select the source folder (required if action is folder specific).',
                required: true,
                refreshers: [], // Depends on accountId from parent props
                options: async () => {
                    if (!auth || !accountId) return { disabled: true, placeholder: 'Select an account first', options: [] };
                    const folders = await fetchFolders(auth as OAuth2PropertyValue, accountId as string);
                    if (folders.length === 0) return { disabled: true, placeholder: 'No folders found', options: [] };
                    return { disabled: false, options: folders };
                }
            });
            return currentFolderProps;
        }
    }),
    isArchive: Property.Checkbox({
        displayName: 'Include Archived Emails',
        description: 'Whether the move action should include archived emails.',
        required: false,
        defaultValue: false,
    }),
  },
  async run(context) {
    const { accountId, destfolderId, messageIds, threadIds, isFolderSpecific, folderId, isArchive } = context.propsValue;
    const accessToken = context.auth.access_token;

    if (!messageIds && !threadIds) {
      throw new Error('Either Message IDs or Thread IDs must be provided.');
    }
    const finalMessageIds = messageIds as string[] | undefined;
    const finalThreadIds = threadIds as string[] | undefined;

    if ((!finalMessageIds || finalMessageIds.length === 0) && (!finalThreadIds || finalThreadIds.length === 0)) {
        throw new Error('Provide at least one Message ID or Thread ID.');
    }

    const requestBody: Record<string, unknown> = {
      mode: 'moveMessage',
      destfolderId,
      isArchive: isArchive ?? false,
    };

    if (finalMessageIds && finalMessageIds.length > 0) {
      requestBody['messageId'] = finalMessageIds;
    }
    if (finalThreadIds && finalThreadIds.length > 0) {
      requestBody['threadId'] = finalThreadIds;
    }

    if (isFolderSpecific) {
        const dynamicFolderProps = folderId as DynamicPropsValue;
        if (!dynamicFolderProps || !dynamicFolderProps['currentFolderId']){
            throw new Error('Source Folder ID is required when action is folder specific.');
        }
        requestBody['isFolderSpecific'] = true;
        requestBody['folderId'] = dynamicFolderProps['currentFolderId'];
    } else {
        requestBody['isFolderSpecific'] = false;
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
