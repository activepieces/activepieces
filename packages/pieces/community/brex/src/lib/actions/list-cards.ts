import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexCard } from '../common';

export const listCards = createAction({
  auth: brexAuth,
  name: 'list_cards',
  displayName: 'List Cards',
  description: 'List the cards in your Brex account, optionally for a single user.',
  props: {
    userId: Property.Dropdown({
      displayName: 'Owner',
      description: 'Only return cards owned by this user. Leave empty to list all cards.',
      auth: brexAuth,
      refreshers: [],
      required: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Brex account first',
          };
        }
        try {
          const response = await brexCommon.apiCall<{ items: { id: string; first_name: string; last_name: string; email: string }[] }>({
            token: brexCommon.getToken(auth),
            method: HttpMethod.GET,
            path: '/v2/users',
            queryParams: { limit: '100' },
          });
          return {
            disabled: false,
            options: response.body.items.map((user) => ({
              label: `${user.first_name} ${user.last_name} (${user.email})`,
              value: user.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load users. Check your connection.',
          };
        }
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of cards to return (1-100).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { userId, limit } = context.propsValue;
    const response = await brexCommon.apiCall<{ items: BrexCard[] }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/cards',
      queryParams: {
        limit: String(limit ?? 50),
        ...(userId ? { user_id: userId } : {}),
      },
    });
    return response.body.items.map(brexCommon.flattenCard);
  },
});
