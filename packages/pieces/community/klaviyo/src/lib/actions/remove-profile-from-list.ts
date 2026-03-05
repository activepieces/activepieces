import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest, listListsForDropdown } from '../common';

export const removeProfileFromList = createAction({
  auth: klaviyoAuth,
  name: 'remove_profile_from_list',
  displayName: 'Remove Profile from List',
  description: 'Remove a profile from a Klaviyo list.',
  props: {
    listId: Property.Dropdown({
      displayName: 'List',
      description: 'The list to remove the profile from.',
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
      description: 'The Klaviyo profile ID to remove.',
      required: true,
    }),
  },
  async run(context) {
    const { listId, profileId } = context.propsValue;

    return klaviyoApiRequest(
      context.auth as string,
      HttpMethod.DELETE,
      `/lists/${listId}/relationships/profiles`,
      {
        data: [{ type: 'profile', id: profileId }],
      },
    );
  },
});
