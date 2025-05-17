import { OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const ZOHO_MAIL_API_URL = 'https://mail.zoho.com/api';

export const zohoMailCommon = {
  baseUrl: ZOHO_MAIL_API_URL,

  // Get all accounts for the authenticated user
  async fetchAccounts(auth: OAuth2PropertyValue) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoMailCommon.baseUrl}/accounts`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
      },
    });

    if (response.status !== 200 || !response.body.data || response.body.data.length === 0) {
      throw new Error('Failed to get accounts');
    }

    return response.body.data.map((account: any) => {
      return {
        label: account.displayName || account.accountDisplayName || account.emailAddress?.[0]?.mailId || account.accountId,
        value: account.accountId,
      };
    });
  },

  // Get account ID from the authenticated user (for backward compatibility)
  async getAccountId(auth: OAuth2PropertyValue): Promise<string> {
    const accounts = await zohoMailCommon.fetchAccounts(auth);
    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }
    // Return the first account ID
    return accounts[0].value;
  },

  // Get all folders for the account
  async fetchFolders(auth: OAuth2PropertyValue, accountId: string) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoMailCommon.baseUrl}/accounts/${accountId}/folders`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
      },
    });

    if (response.status !== 200 || !response.body.data) {
      throw new Error('Failed to get folders');
    }

    return response.body.data.map((folder: any) => {
      return {
        label: folder.folderName,
        value: folder.folderId,
      };
    });
  },

  // Common properties
  accountIdProperty: Property.Dropdown({
    displayName: 'Account',
    description: 'Select the Zoho Mail account',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }

      try {
        const accounts = await zohoMailCommon.fetchAccounts(auth as OAuth2PropertyValue);
        if (accounts.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No accounts found',
          };
        }

        return {
          disabled: false,
          options: accounts,
        };
      } catch (error) {
        console.error('Error fetching accounts:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error fetching accounts',
        };
      }
    },
  }),

  folderProperty: Property.Dropdown({
    displayName: 'Folder',
    description: 'Select the folder to monitor',
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
        const folders = await zohoMailCommon.fetchFolders(auth as OAuth2PropertyValue, accountId as string);
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

  // Format email addresses for API requests
  formatEmailAddresses(emails: string[]): string {
    if (!emails || emails.length === 0) return '';
    return emails.join(',');
  },

  // Get email content
  async getEmailContent(auth: OAuth2PropertyValue, accountId: string, folderId: string, messageId: string, includeBlockContent: boolean = false) {
    const queryParams: Record<string, string> = {};
    if (includeBlockContent) {
      queryParams.includeBlockContent = 'true';
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoMailCommon.baseUrl}/accounts/${accountId}/folders/${folderId}/messages/${messageId}/content`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
      },
      queryParams,
    });

    if (response.status !== 200) {
      throw new Error('Failed to get email content');
    }

    return response.body.data;
  },

  // Get email details
  async getEmailDetails(auth: OAuth2PropertyValue, accountId: string, folderId: string, messageId: string) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoMailCommon.baseUrl}/accounts/${accountId}/folders/${folderId}/messages/${messageId}/details`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
      },
    });

    if (response.status !== 200) {
      throw new Error('Failed to get email details');
    }

    return response.body.data;
  },

  // Get attachment info
  async getAttachmentInfo(auth: OAuth2PropertyValue, accountId: string, folderId: string, messageId: string, includeInline: boolean = false) {
    const queryParams: Record<string, string> = {};
    if (includeInline) {
      queryParams.includeInline = 'true';
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoMailCommon.baseUrl}/accounts/${accountId}/folders/${folderId}/messages/${messageId}/attachmentinfo`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
      },
      queryParams,
    });

    if (response.status !== 200) {
      throw new Error('Failed to get attachment info');
    }

    return response.body.data;
  },
};
