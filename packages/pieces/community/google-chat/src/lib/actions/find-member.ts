import { createAction, Property } from '@activepieces/pieces-framework';
import { googleChatAuth } from '../common/auth';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getSpacesOptions, makeGoogleChatRequest } from '../common/utils';

export const findMemberAction = createAction({
  auth: googleChatAuth,
  name: 'find_member',
  displayName: 'Find Member',
  description: 'Search space member by email',
  props: {
    space: Property.Dropdown({
      displayName: 'Space',
      description: 'The space to search in',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        return getSpacesOptions(auth as OAuth2PropertyValue);
      },
    }),
    memberEmail: Property.ShortText({
      displayName: 'Member Email',
      description: 'The email address of the member to find',
      required: true,
    }),
  },
  async run(context) {
    const { space, memberEmail } = context.propsValue;
    const token = (context.auth as OAuth2PropertyValue).access_token;

    return makeGoogleChatRequest(
      `https://chat.googleapis.com/v1/${space}/members/${memberEmail}`,
      token
    );
  },
}); 