import { Property } from '@activepieces/pieces-framework';
import { fetchMailboxes } from './imap';
import { imapAuth } from './auth';

interface DropdownParams {
  description?: string;
  displayName: string;
  required: boolean;
}

export const mailboxDropdown = (params: DropdownParams) =>
  Property.Dropdown<string,boolean,typeof imapAuth>({
    auth: imapAuth,
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
        const mailboxes = await fetchMailboxes(auth);
        const options = mailboxes.map(
          ({ path }: { path: string }) => ({
            label: path,
            value: path,
          })
        );

        if (options.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No folders found on this account.',
          };
        }

        return { disabled: false, options };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: `Couldn't load folders: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  });
