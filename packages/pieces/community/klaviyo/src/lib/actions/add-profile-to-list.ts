import { createAction } from '@activepieces/pieces-framework';
import { allProfileIdsMultiSelectDropdown, listIdDropdown } from '../common/props';
import { klaviyoAuth, KlaviyoAuthValue } from '../common/auth';
import { makeRequest, normalizeProfileIds } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addProfileToList = createAction({
  auth: klaviyoAuth,
  name: 'addProfileToList',
  displayName: 'Add Profile to List',
  description:
    'Add profiles to a specific list without changing subscription status.',
  props: {
    list_id: listIdDropdown,
    profile_id: allProfileIdsMultiSelectDropdown,
  },
  async run({ auth, propsValue }) {
    const { list_id, profile_id: rawProfileId } = propsValue;
    const profile_id = normalizeProfileIds(rawProfileId);

    if (!profile_id || profile_id.length === 0) {
      throw new Error('At least one profile is required');
    }

    const body = {
      data: (profile_id as string[]).map((id) => ({
        type: 'profile',
        id,
      })),
    };

    const response = await makeRequest(
      auth as KlaviyoAuthValue,
      HttpMethod.POST,
      `/lists/${list_id}/relationships/profiles`,
      body
    );

    if (!response || Object.keys(response).length === 0) {
      return {
        success: true,
        message: `Successfully added ${profile_id.length} profile(s) to list`,
        profiles_added: profile_id.length,
      };
    }

    return response;
  },
});
