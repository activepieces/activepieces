import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';

export const findWhatsappAccount = createAction({
  auth: timelinesAiAuth,
  name: 'findWhatsappAccount',
  displayName: 'Find WhatsApp Account',
  description: 'Search for a WhatsApp account (by phone or ID).',
  props: {
    id: Property.ShortText({
      displayName: 'WhatsApp Account ID',
      description:
        'The unique identifier of the WhatsApp account to search for.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'The phone number associated with the WhatsApp account to search for.',
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
