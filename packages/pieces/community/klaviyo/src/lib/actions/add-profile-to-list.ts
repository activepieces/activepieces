import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest, listListsForDropdown } from '../common';

export const addProfileToList = createAction({
  auth: klaviyoAuth,
  name: 'add_profile_to_list',
  displayName: 'Add Profile to List',
  description: 'Add an existing profile to a Klaviyo list.',
  props: {
    listId: Property.Dropdown({
      displayName: 'List',
      description: 'The list to add the profile to.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Klaviyo account first.',
            options: [],
          };
        }
        const options = await listListsForDropdown(auth as string);
        return { disabled: false, options };
      },
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The Klaviyo profile ID to add.',
      required: true,
    }),
  },
  async run(context) {
    const { listId, profileId } = context.propsValue;

    return klaviyoApiRequest(
      context.auth as string,
      HttpMethod.POST,
      `/lists/${listId}/relationships/profiles`,
      {
        data: [{ type: 'profile', id: profileId }],
      },
    );
  },
});
