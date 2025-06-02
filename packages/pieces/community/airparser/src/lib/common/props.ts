import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './index';

export const inboxIdDropdown = Property.Dropdown({
  displayName: 'Inbox',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Airparser account',
        options: [],
      };
    }
    const apiKey = auth as string;
    const inboxes = await makeRequest(apiKey, HttpMethod.GET, '/inboxes');
    const options: DropdownOption<string>[] = inboxes.map((inbox: { name: string; id: string }) => ({
      label: inbox.name,
      value: inbox.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const documentIdDropdown = Property.Dropdown({
  displayName: 'Document',
  required: true,
  refreshers: ['inboxId'],
  options: async ({ auth, inboxId }) => {
    if (!auth || !inboxId) {
      return {
        disabled: true,
        placeholder: 'Select an inbox first',
        options: [],
      };
    }
    const apiKey = auth as string;
    const docs = await makeRequest(apiKey, HttpMethod.GET, `/inboxes/${inboxId}/docs`);
    const options: DropdownOption<string>[] = docs.map((doc: { id: string; name?: string }) => ({
      label: doc.name || doc.id,
      value: doc.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});
