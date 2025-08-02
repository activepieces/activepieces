import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

export const HELP_SCOUT_API_URL = 'https://api.helpscout.net/v2';

export interface HelpScoutAuthValue {
  apiKey: string;
  appId?: string;
  appSecret?: string;
}

export const helpScoutCommon: any = {
  baseUrl: HELP_SCOUT_API_URL,

  async makeRequest(
    auth: HelpScoutAuthValue,
    method: HttpMethod,
    endpoint: string,
    body?: any,
    queryParams?: QueryParams
  ): Promise<any> {
    const response = await httpClient.sendRequest({
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${auth.apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
      queryParams,
    });

    return response.body;
  },

  // Common property definitions
  mailboxDropdown: Property.Dropdown({
    displayName: 'Mailbox',
    description: 'Select a mailbox',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Help Scout account',
          options: [],
        };
      }

      try {
        const mailboxes = await helpScoutCommon.makeRequest(
          auth as HelpScoutAuthValue,
          HttpMethod.GET,
          '/mailboxes'
        );

        return {
          options: mailboxes._embedded.mailboxes.map((mailbox: any) => ({
            label: mailbox.name,
            value: mailbox.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load mailboxes',
          options: [],
        };
      }
    },
  }),

  userDropdown: Property.Dropdown({
    displayName: 'User',
    description: 'Select a user',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Help Scout account',
          options: [],
        };
      }

      try {
        const users = await helpScoutCommon.makeRequest(
          auth as HelpScoutAuthValue,
          HttpMethod.GET,
          '/users'
        );

        return {
          options: users._embedded.users.map((user: any) => ({
            label: `${user.firstName} ${user.lastName} (${user.email})`,
            value: user.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load users',
          options: [],
        };
      }
    },
  }),

  conversationStatus: Property.StaticDropdown({
    displayName: 'Status',
    description: 'Conversation status',
    required: false,
    options: {
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Closed', value: 'closed' },
        { label: 'Pending', value: 'pending' },
        { label: 'Spam', value: 'spam' },
      ],
    },
  }),

  conversationType: Property.StaticDropdown({
    displayName: 'Type',
    description: 'Conversation type',
    required: false,
    defaultValue: 'email',
    options: {
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Chat', value: 'chat' },
        { label: 'Phone', value: 'phone' },
      ],
    },
  }),

  tags: Property.Array({
    displayName: 'Tags',
    description: 'Tags to add to the conversation',
    required: false,
  }),

  customFields: Property.Object({
    displayName: 'Custom Fields',
    description: 'Custom field values',
    required: false,
  }),

  // Helper functions
  parseWebhookBody(body: any) {
    // Help Scout sends webhook data as JSON
    return typeof body === 'string' ? JSON.parse(body) : body;
  },

  // Pagination helper
  async getAllPages(
    auth: HelpScoutAuthValue,
    endpoint: string,
    queryParams?: QueryParams
  ): Promise<any[]> {
    const allItems: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.makeRequest(auth, HttpMethod.GET, endpoint, undefined, {
        ...queryParams,
        page: page.toString(),
      });

      const embeddedKey = Object.keys(response._embedded)[0];
      const items = response._embedded[embeddedKey] || [];
      allItems.push(...items);

      hasMore = page < response.page.totalPages;
      page++;
    }

    return allItems;
  },
};