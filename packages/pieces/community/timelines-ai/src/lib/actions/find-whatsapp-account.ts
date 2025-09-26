import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth } from '../common/auth';
import { timelinesAiClient } from '../common/client';

export const findWhatsappAccountAction = createAction({
  auth: timelinesAiAuth,
  name: 'find_whatsapp_account',
  displayName: 'Find WhatsApp Account',
  description: 'Finds a connected WhatsApp account by its ID or phone number.',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'The field to search for an account by.',
      required: true,
      options: {
        options: [
          { label: 'Account ID', value: 'id' },
          { label: 'Phone Number', value: 'phone' },
        ],
      },
    }),
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'The ID or phone number of the account to find.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { searchBy, searchTerm } = propsValue;
    const allAccounts = await timelinesAiClient.getWhatsAppAccounts(auth);
    const foundAccounts = allAccounts.filter((account) => {
      if (searchBy === 'id') {
        return account.id === searchTerm;
      }
      if (searchBy === 'phone') {
        return account.phone === searchTerm;
      }
      return false;
    });
    return foundAccounts;
  },
});
