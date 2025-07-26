import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { listIdDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

interface KlaviyoProfile {
  type: string;
  id: string;
  attributes: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  };
}

export const removeProfileFromList = createAction({
  auth: klaviyoAuth,
  name: 'removeProfileFromList',
  displayName: 'Remove Profile from List',
  description: 'Remove profiles from a specific list.',
  props: {
    list_id: listIdDropdown,
    profile_ids: Property.MultiSelectDropdown({
      displayName: 'Profiles to Remove',
      description: 'Select profiles to remove from the list (max 1000)',
      required: true,
      refreshers: ['auth', 'list_id'],
      options: async ({ auth, list_id }) => {
        if (!auth || !list_id) {
          return {
            disabled: true,
            placeholder: !auth ? 'Connect your account' : 'Select a list first',
            options: [],
          };
        }

        try {
          const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
          const profiles = await makeRequest(authProp.access_token, HttpMethod.GET, `/lists/${list_id}/profiles`, {});

          if (!profiles.data || profiles.data.length === 0) {
            return {
              disabled: true,
              placeholder: 'No profiles found in this list',
              options: [],
            };
          }

          const options = (profiles.data as KlaviyoProfile[]).map((profile) => {
            const firstName = profile.attributes.first_name || '';
            const lastName = profile.attributes.last_name || '';
            const email = profile.attributes.email || '';
            
            let label = [firstName, lastName].filter(Boolean).join(' ');
            if (label && email) {
              label += ` (${email})`;
            } else if (email) {
              label = email;
            } else {
              label = profile.id;
            }

            return {
              label,
              value: profile.id,
            };
          });

          return {
            disabled: false,
            options: options,
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading profiles',
            options: [],
          };
        }
      },
    }),
  },
  async run({ propsValue, auth }) {
    const { list_id, profile_ids } = propsValue;

    if (!profile_ids || profile_ids.length === 0) {
      throw new Error('At least one profile must be selected');
    }

    if (profile_ids.length > 1000) {
      throw new Error('Maximum of 1000 profiles can be removed at once');
    }

    const data = {
      data: profile_ids.map((id: string) => ({
        type: 'profile',
        id,
      })),
    };

    const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
    const response = await makeRequest(
      authProp.access_token,
      HttpMethod.DELETE,
      `/lists/${list_id}/relationships/profiles`,
      data
    );

    if (!response) {
      return { 
        success: true,
        message: `Successfully removed ${profile_ids.length} profile(s) from the list`,
        profiles_removed: profile_ids.length
      };
    }

    return response;
  },
});
