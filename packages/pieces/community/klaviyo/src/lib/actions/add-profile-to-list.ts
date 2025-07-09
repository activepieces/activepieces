import { createAction } from '@activepieces/pieces-framework';
import { listIdDropdown, profileIdsMultiSelectDropdown } from '../common/props';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';


export const addProfileToList = createAction({
  auth: klaviyoAuth, 
  name: 'addProfileToList',
  displayName: 'Add Profile to List',
  description: '',
  props: {
    list_id: listIdDropdown,
    profile_id: profileIdsMultiSelectDropdown
  },
  async run(context) {
    // Action logic here
    const { api_key } = context.auth
    const { list_id, profile_id } = context.propsValue
    const data = {
      data: profile_id.map((id: string) => ({
        type: 'profile',
        id,
      })),
    };
    return await makeRequest(
      api_key,
      HttpMethod.POST,
      `/lists/${list_id}/relationships/profiles`,
      data
    );
  },
});
