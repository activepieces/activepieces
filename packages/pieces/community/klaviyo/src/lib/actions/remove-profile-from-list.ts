import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { listIdDropdown, profileIdsMultiSelectDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const removeProfileFromList= createAction({
  auth: klaviyoAuth, 
  name: 'removeProfileFromList	',
  displayName: 'Remove Profile from List	',
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
      HttpMethod.DELETE,
      `/lists/${list_id}/relationships/profiles`,
      data
    );
  },
});
