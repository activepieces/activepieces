import { VboutClient } from './client';
import { Property } from '@activepieces/pieces-framework';

export function makeClient(apiKey: string): VboutClient {
  return new VboutClient(apiKey);
}

export const vboutCommon = {
  baseUrl: 'https://api.vbout.com/1',
  listId: (required = true) =>
    Property.Dropdown({
      displayName: 'List ID',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = makeClient(auth as string);
        const res = await client.listEmailLists();
        return {
          disabled: false,
          options: res.lists.items.map((list) => {
            return {
              label: list.name,
              value: list.id,
            };
          }),
        };
      },
    }),
};
