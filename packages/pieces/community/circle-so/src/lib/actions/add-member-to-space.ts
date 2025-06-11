import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeCircleRequest } from '../common/index';
import { spaceDropdown } from '../common/props';
import { circleAuth } from '../../index';

export const addMemberToSpaceAction = createAction({
  name: 'add_member_to_space',
  auth: circleAuth,
  displayName: 'Add Member to Space',
  description: 'Automatically add users to a course or community group based on CRM activity.',
  props: {
    email: Property.ShortText({
      displayName: 'Member Email',
      description: 'Email address of the member to be added',
      required: true,
    }),
    spaceId: spaceDropdown,
  },
  async run(context) {
    const { email, spaceId } = context.propsValue;

    const query = new URLSearchParams({
      email,
      space_id: spaceId,
    }).toString();

    return await makeCircleRequest(
      context.auth as string,
      HttpMethod.POST,
      `/space_members?${query}`
    );
  },
});
