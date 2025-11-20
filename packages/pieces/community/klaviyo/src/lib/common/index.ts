import { klaviyoAuth } from '../../';
import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { KlaviyoClient } from './client';

export function makeClient(auth: PiecePropValueSchema<typeof klaviyoAuth>) {
  const client = new KlaviyoClient(auth);
  return client;
}

export const klaviyoCommon = {
  listId: (required = true) =>
    Property.Dropdown({
      displayName: 'List',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        const client = makeClient(auth as PiecePropValueSchema<typeof klaviyoAuth>);
        const res = await client.getLists();

        return {
          disabled: false,
          options: res.data.map((list) => {
            return {
              label: list.attributes.name,
              value: list.id!,
            };
          }),
        };
      },
    }),

  profileId: (required = true) =>
    Property.Dropdown({
      displayName: 'Profile',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        const client = makeClient(auth as PiecePropValueSchema<typeof klaviyoAuth>);
        const res = await client.listProfiles(50);

        return {
          disabled: false,
          options: res.data.map((profile) => {
            const label = profile.attributes.email || 
                         profile.attributes.phone_number || 
                         `${profile.attributes.first_name || ''} ${profile.attributes.last_name || ''}`.trim() ||
                         profile.id || 
                         'Unknown';
            return {
              label: label,
              value: profile.id!,
            };
          }),
        };
      },
    }),
};

export * from './types';
export * from './client';

