import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth, KlaviyoAuthValue } from '../common/auth';
import { listIdDropdown, profileIdsMultiSelectDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, normalizeProfileIds } from '../common/client';

export const removeProfileFromList = createAction({
  auth: klaviyoAuth,
  name: 'removeProfileFromList',
  displayName: 'Remove Profile from List',
  description: 'Remove profiles from a specific list.',
  props: {
    list_id: listIdDropdown,
    profile_ids: profileIdsMultiSelectDropdown,
  },
  async run({ propsValue, auth }) {
    const { list_id, profile_ids: rawProfileIds } = propsValue;
    const profile_ids = normalizeProfileIds(rawProfileIds);

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

    const response = await makeRequest(
      auth as KlaviyoAuthValue,
      HttpMethod.DELETE,
      `/lists/${list_id}/relationships/profiles`,
      data
    );

    if (!response) {
      return {
        success: true,
        message: `Successfully removed ${profile_ids.length} profile(s) from the list`,
        profiles_removed: profile_ids.length,
      };
    }

    return response;
  },
});
