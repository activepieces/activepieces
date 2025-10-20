import { Property } from '@activepieces/pieces-framework';
import { fetchMailboxes } from './imap';
import { type ImapAuth } from './auth';

interface DropdownParams {
  description?: string;
  displayName: string;
  required: boolean;
}

export const mailboxDropdown = (params: DropdownParams) =>
  Property.Dropdown<string>({
    displayName: params.displayName,
    description: params.description,
    required: params.required,
    refreshers: [],
    async options({ auth }) {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }

      try {
        const mailboxes = await fetchMailboxes(auth as ImapAuth);
        const options = mailboxes.map(
          ({ name, path }: { name: string; path: string }) => ({
            label: name,
            value: path,
          })
        );

        return { disabled: false, options };
      } catch (error: any) {
        return {
          disabled: true,
          options: [],
          placeholder: `Error: ${error.message}`,
        };
      }
    },
  });
