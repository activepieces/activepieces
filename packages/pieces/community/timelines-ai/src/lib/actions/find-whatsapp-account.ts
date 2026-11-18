import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';

export const findWhatsappAccount = createAction({
  auth: timelinesAiAuth,
  name: 'findWhatsappAccount',
  classification: 'SEARCH',
  displayName: 'Find WhatsApp Account',
  description: 'Finds a connected WhatsApp account by ID or phone.',
  audience: 'both',
  aiMetadata: { description: 'Lists the WhatsApp accounts connected to TimelinesAI, optionally narrowed by account ID and/or phone number; with neither supplied it returns all accounts. Use to resolve a whatsapp_account_id before sending a message from a specific number. Read-only and idempotent.', idempotent: true },
  propertyGroups: [
    {
      key: 'filters',
      display: 'section',
      label: 'Filters',
      icon: 'filter',
      props: ['id', 'phone'],
    },
  ],
  props: {
    id: Property.ShortText({
      displayName: 'WhatsApp Account ID',
      description: 'Empty: any account.',
      placeholder: '14155550123@s.whatsapp.net',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'International format with country code.',
      placeholder: '+14155550123',
      required: false,
    }),
  },
  async run({ auth: apiKey, propsValue: { id, phone } }) {
    const response = await timelinesAiCommon.listWhatsappAccounts({
      apiKey,
    });
    if (response.status !== 'ok') {
      throw new Error(
        `Error fetching WhatsApp accounts: ${response.message || 'Unknown error'}`
      );
    }
    return response.data.whatsapp_accounts.filter((acc) => {
      if (id && phone) {
        return acc.id === id && acc.phone === phone;
      }
      if (id) {
        return acc.id === id;
      }
      if (phone) {
        return acc.phone === phone;
      }
      return true;
    });
  },
});
