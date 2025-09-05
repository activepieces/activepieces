import { createAction, Property } from '@activepieces/pieces-framework';
import { googleChatApiAuth } from '../common/constants';
import { peoplesDropdown, spacesDropdown, spacesMembersDropdown } from '../common/props';
import { googleChatAPIService } from '../common/requests';

export const addASpaceMember = createAction({
  auth: googleChatApiAuth,
  name: 'addASpaceMember',
  displayName: 'Add a Space Member',
  description: 'Add a user to a Google Chat space.',
  props: {
    spaceId: spacesDropdown({ refreshers: ['auth'], required: true }),
    personId: peoplesDropdown(['auth']),
  },
  async run({ auth, propsValue }) {
    const { spaceId, personId } = propsValue;

    const userId = (personId as string).replace('people', 'users');
    
    const response = await googleChatAPIService.AddASpaceMember({
      accessToken: auth.access_token,
      spaceId: spaceId as string,
      userId: userId as string
    })

    return response;
  },
});
