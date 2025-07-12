import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { listIdDropdown, ListprofileIdsMultiSelectDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const removeProfileFromList = createAction({
  auth: klaviyoAuth,
  name: 'removeProfileFromList	',
  displayName: 'Remove Profile from List	',
  description: 'Remove a profile from a specific list.',
  props: {
    list_id: listIdDropdown,
    profile_id: ListprofileIdsMultiSelectDropdown
  },
  async run({ propsValue, auth }) {
    // Action logic here

    const { list_id, profile_id } = propsValue
    const data = {
      data: profile_id.map((id: string) => ({
        type: 'profile',
        id,
      })),
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.DELETE,
      `/lists/${list_id}/relationships/profiles`,
      data
    );

    //If the response is empty or undefined, return a default success message
    if (!response) {
      return { message: "Removed successfully" };
    }

    return response;;

  },
});
