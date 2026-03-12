import { Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from './index';
import { makeClient } from './index';

export const businessAccountIdDropdown = Property.Dropdown({
  auth: kapsoAuth,
  displayName: 'Business Account',
  description: 'Select the WhatsApp Business Account.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Kapso account first',
        options: [],
      };
    }

    try {
      const client = makeClient(auth.secret_text);
      const response = await client.request<{
        data: Array<{
          id: string;
          name: string;
        }>;
      }>('GET', 'business_accounts', { responseType: 'json' });

      return {
        options: response.data.map((ba) => ({
          label: ba.name,
          value: ba.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        placeholder: 'Could not load business accounts',
        options: [],
      };
    }
  },
});

export const templateDropdown = Property.Dropdown({
  auth: kapsoAuth,
  displayName: 'Template',
  description: 'Select a message template to send.',
  required: true,
  refreshers: ['businessAccountId'],
  options: async ({ auth, businessAccountId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Kapso account first',
        options: [],
      };
    }

    if (!businessAccountId) {
      return {
        disabled: true,
        placeholder: 'Select a business account first',
        options: [],
      };
    }

    try {
      const client = makeClient(auth.secret_text);
      const response = await client.templates.list({
        businessAccountId: businessAccountId as string,
        status: 'APPROVED',
        limit: 100,
      });

      return {
        options: response.data.map((t) => ({
          label: `${t.name} (${t.language ?? 'unknown'})`,
          value: JSON.stringify({ name: t.name, language: t.language }),
        })),
      };
    } catch {
      return {
        disabled: true,
        placeholder: 'Could not load templates',
        options: [],
      };
    }
  },
});

export const phoneNumberIdDropdown = Property.Dropdown({
  auth: kapsoAuth,
  displayName: 'Phone Number',
  description: 'Select the WhatsApp phone number to send from.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Kapso account first',
        options: [],
      };
    }

    try {
      const client = makeClient(auth.secret_text);
      const response = await client.request<{
        data: Array<{
          id: string;
          display_phone_number: string;
          verified_name: string;
        }>;
      }>('GET', 'phone_numbers', { responseType: 'json' });

      return {
        options: response.data.map((pn) => ({
          label: `${pn.verified_name} (${pn.display_phone_number})`,
          value: pn.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        placeholder: 'Could not load phone numbers',
        options: [],
      };
    }
  },
});
