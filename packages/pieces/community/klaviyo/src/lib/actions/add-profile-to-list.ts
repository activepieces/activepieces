import { createAction } from '@activepieces/pieces-framework';
import { listIdDropdown, profileIdsMultiSelectDropdown } from '../common/props';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addProfileToList = createAction({
  auth: klaviyoAuth,
  name: 'addProfileToList',
  displayName: 'Add Profile to List',
  description: 'Add profiles to a specific list without changing subscription status.',
  props: {
    list_id: listIdDropdown,
    profile_id: profileIdsMultiSelectDropdown
  },
  async run({ auth, propsValue }) {
    const { list_id, profile_id } = propsValue;

    if (!profile_id || profile_id.length === 0) {
      throw new Error('At least one profile is required');
    }

    if (profile_id.length > 1000) {
      throw new Error('Maximum of 1000 profiles can be added to a list at once');
    }

    const body = {
      data: profile_id.map((id: string) => ({
        type: 'profile',
        id,
      })),
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      `/lists/${list_id}/relationships/profiles`,
      body
    );

    if (!response || Object.keys(response).length === 0) {
      return { 
        success: true,
        message: `Successfully added ${profile_id.length} profile(s) to list`,
        profiles_added: profile_id.length 
      };
    }

    return response;
  },
});
