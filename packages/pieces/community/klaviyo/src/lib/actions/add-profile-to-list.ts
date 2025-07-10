import { createAction } from '@activepieces/pieces-framework';
import { listIdDropdown, profileIdsMultiSelectDropdown } from '../common/props';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';


export const addProfileToList = createAction({
  auth: klaviyoAuth,
  name: 'addProfileToList',
  displayName: 'Add Profile to List',
  description: 'Add a profile to a specific list.',
  props: {
    list_id: listIdDropdown,
    profile_id: profileIdsMultiSelectDropdown
  },
  async run({ auth, propsValue }) {
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
      HttpMethod.POST,
      `/lists/${list_id}/relationships/profiles`,
      data
    );

    //If the response is empty or undefined, return a default success message
    if (!response) {
      return { message: "Added successfully" };
    }

    return response;
  },
});
