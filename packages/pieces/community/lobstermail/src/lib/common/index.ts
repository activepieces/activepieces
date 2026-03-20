import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { lobstermailAuth } from '../..';

const baseUrl = 'https://api.lobstermail.ai';

async function fetchInboxes(auth: string) {
  const response = await httpClient.sendRequest<{
    data: { id: string; address: string; displayName?: string }[];
  }>({
    method: HttpMethod.GET,
    url: `${baseUrl}/v1/inboxes`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth },
  });
  return response.body.data ?? [];
}

export const inboxIdDropdown = Property.Dropdown({
  auth: lobstermailAuth,
  displayName: 'Inbox',
  description: 'Select the inbox to use.',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    }
    try {
      const inboxes = await fetchInboxes(auth.secret_text);
      return {
        disabled: false,
        options: inboxes.map((inbox) => ({
          label: inbox.displayName ? `${inbox.displayName} <${inbox.address}>` : inbox.address,
          value: inbox.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load inboxes. Check your API key.' };
    }
  },
});

export const inboxIdDropdownOptional = Property.Dropdown({
  auth: lobstermailAuth,
  displayName: 'Inbox',
  description: 'Limit results to a specific inbox. Leave empty to search all inboxes.',
  refreshers: [],
  required: false,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    }
    try {
      const inboxes = await fetchInboxes(auth.secret_text);
      return {
        disabled: false,
        options: inboxes.map((inbox) => ({
          label: inbox.displayName ? `${inbox.displayName} <${inbox.address}>` : inbox.address,
          value: inbox.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load inboxes. Check your API key.' };
    }
  },
});

export const fromAddressDropdown = Property.Dropdown({
  auth: lobstermailAuth,
  displayName: 'From',
  description: 'Select the inbox to send from. Must be an active inbox on your account.',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    }
    try {
      const inboxes = await fetchInboxes(auth.secret_text);
      return {
        disabled: false,
        options: inboxes.map((inbox) => ({
          label: inbox.displayName ? `${inbox.displayName} <${inbox.address}>` : inbox.address,
          value: inbox.address,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load inboxes. Check your API key.' };
    }
  },
});

export const lobstermailCommon = {
  baseUrl,
};
