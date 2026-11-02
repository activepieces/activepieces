import { DropdownState, Property } from '@activepieces/pieces-framework';
import { sendfoxAuth } from '../auth';
import { sendfoxClient } from './client';
import type { SendfoxList } from './types';

function list<R extends boolean>({
  required,
  displayName = 'List',
  description = 'A SendFox list.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: sendfoxAuth,
    displayName,
    description,
    required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth || !auth.secret_text) {
        return disabledOptions({
          placeholder: 'Please connect your account first',
        });
      }
      try {
        const lists = await sendfoxClient.paginate<SendfoxList>({
          auth,
          path: '/lists',
        });
        if (lists.length === 0) {
          return {
            disabled: false,
            placeholder: 'No lists found. Create one in SendFox first.',
            options: [],
          };
        }
        return {
          disabled: false,
          options: lists.map((list) => ({ label: list.name, value: list.id })),
        };
      } catch {
        return disabledOptions({
          placeholder: 'Failed to load lists. Check your connection.',
        });
      }
    },
  });
}

function disabledOptions({
  placeholder,
}: {
  placeholder: string;
}): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const sendfoxProps = { list };

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
