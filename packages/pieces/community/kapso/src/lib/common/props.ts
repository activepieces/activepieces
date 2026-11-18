import { MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from './index';
import { makeClient } from './index';

export const businessAccountIdProp = Property.ShortText({
  displayName: 'Business Account ID',
  description: 'Your WhatsApp Business Account ID, shown in the Kapso dashboard.',
  placeholder: '102290129340398',
  required: true,
});

export const phoneNumberIdDropdown = Property.Dropdown({
  auth: kapsoAuth,
  displayName: 'Phone Number',
  description: 'The WhatsApp number that sends the message.',
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
        placeholder: 'Enter Business Account ID first',
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
      }>('GET', `${businessAccountId}/phone_numbers`, { responseType: 'json' });

      if (response.data.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No phone numbers found for this business account.',
        };
      }

      return {
        options: response.data.map((pn) => ({
          label: `${pn.verified_name} (${pn.display_phone_number})`,
          value: pn.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        placeholder: 'Could not load phone numbers. Check the Business Account ID.',
        options: [],
      };
    }
  },
});

export const templateDropdown = Property.Dropdown({
  auth: kapsoAuth,
  displayName: 'Template',
  description: 'An approved template from this business account.',
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
        placeholder: 'Enter Business Account ID first',
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

      if (response.data.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No approved templates found for this business account.',
        };
      }

      return {
        options: response.data.map((t) => ({
          label: `${t.name} (${t.language ?? 'unknown'})`,
          value: JSON.stringify({ name: t.name, language: t.language }),
        })),
      };
    } catch {
      return {
        disabled: true,
        placeholder: 'Could not load templates. Check the Business Account ID.',
        options: [],
      };
    }
  },
});

export const recipientPhoneProp = Property.ShortText({
  displayName: 'Recipient Phone Number',
  description: "The person's WhatsApp number, with country code.",
  placeholder: '15551234567',
  required: true,
});

export const freeFormWindowInfo = Property.MarkDown({
  value:
    'WhatsApp delivers this message only if the person messaged you in the last 24 hours. To start a new conversation, use **Send Template Message**.',
  variant: MarkdownVariant.WARNING,
});
