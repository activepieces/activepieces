import { createAction, Property } from '@activepieces/pieces-framework';
import { googleChatAuth } from '../common/auth';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getSpacesOptions, makeGoogleChatRequest } from '../common/utils';

export const addSpaceMemberAction = createAction({
  auth: googleChatAuth,
  name: 'add_space_member',
  displayName: 'Add a Space Member',
  description: 'Add a user to a Google Chat space',
  props: {
    space: Property.Dropdown({
      displayName: 'Space',
      description: 'The space to add the member to',
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
      description: 'The email address of the user to add to the space',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'The role to assign to the member',
      required: true,
      options: {
        options: [
          { label: 'Member', value: 'MEMBER' },
          { label: 'Admin', value: 'ADMIN' },
        ],
      },
    }),
  },
  async run(context) {
    const { space, memberEmail, role } = context.propsValue;
    const token = (context.auth as OAuth2PropertyValue).access_token;

    const memberData: Record<string, unknown> = {
      member: {
        name: `users/${memberEmail}`,
      },
      role,
    };

    return makeGoogleChatRequest(
      `https://chat.googleapis.com/v1/${space}/members`,
      token,
      'POST',
      memberData
    );
  },
}); 