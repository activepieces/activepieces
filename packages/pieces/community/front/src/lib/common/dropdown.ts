import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const conversationIdDropdown = Property.Dropdown({
  displayName: 'Conversation ID',
  description: 'Select the conversation',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        '/conversations'
      );
      const conversations = response._results || [];
      console.log(response);
      return {
        disabled: false,
        options: conversations.map((conv: any) => ({
          label: conv.subject || conv.id,
          value: conv.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading conversations',
      };
    }
  },
});

export const contactIdDropdown = Property.Dropdown({
  displayName: 'Contact ID',
  description: 'Select the contact',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        '/contacts?limit=50'
      );
      const contacts = response._results || [];
      return {
        disabled: false,
        options: contacts.map((contact: any) => ({
          label: contact.name || contact.id,
          value: contact.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading contacts',
      };
    }
  },
});

export const tagIdsDropdown = Property.MultiSelectDropdown({
  displayName: 'Tag IDs',
  description: 'Select one or more tags',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const response = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        '/tags?limit=50'
      );
      const tags = response._results || [];
      return {
        disabled: false,
        options: tags.map((tag: any) => ({
          label: tag.name || tag.id,
          value: tag.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading tags',
      };
    }
  },
});

export const teammateIdDropdown = Property.Dropdown({
  displayName: 'Teammate ID',
  description: 'Select the teammate',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const response = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        '/teammates?limit=50'
      );
      const teammates = response._results || [];
      return {
        disabled: false,
        options: teammates.map((teammate: any) => ({
          label: teammate.username || teammate.first_name + ' ' + teammate.last_name || teammate.id,
          value: teammate.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teammates',
      };
    }
  },
});

export const channelIdDropdown  = Property.Dropdown({
  displayName: 'Channel ID',
  description: 'Select the channel',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const response = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        '/channels'
      );
      const channels = response._results || [];
      return {
        disabled: false,
        options: channels.map((channel: any) => ({
          label: channel.name || channel.id,
          value: channel.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading channels',
      };
    }
  },
});

export const accountIdDropdown = Property.Dropdown({
  displayName: 'Account ID',
  description: 'Select the account',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const response = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        '/accounts'
      );
      const accounts = response._results || [];
      return {
        disabled: false,
        options: accounts.map((account: any) => ({
          label: account.name || account.id,
          value: account.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading accounts',
      };
    }
  },
});

export const inboxIdDropdown = Property.Dropdown({
  displayName: 'Inbox ID',
  description: 'Select the inbox',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const response = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        '/inboxes'
      );
      const inboxes = response._results || [];
      return {
        disabled: false,
        options: inboxes.map((inbox: any) => ({
          label: inbox.name || inbox.id,
          value: inbox.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading inboxes',
      };
    }
  },
});

export const linkIdDropdown = Property.Dropdown({
  displayName: 'Link ID',
  description: 'Select the link',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const response = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        '/links'
      );
      const links = response._results || [];
      return {
        disabled: false,
        options: links.map((link: any) => ({
          label: link.name || link.id,
          value: link.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading links',
      };
    }
  },
});

export const linkidsDropdown = Property.MultiSelectDropdown({
  displayName: 'Link IDs',
  description: 'Select one or more links',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const response = await makeRequest(
        auth as unknown as string,
        HttpMethod.GET,
        '/links'
      );
      const links = response._results || [];
      return {
        disabled: false,
        options: links.map((link: any) => ({
          label: link.name || link.id,
          value: link.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading links',
      };
    }
  },
});
