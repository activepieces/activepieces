import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeCircleRequest } from '../common/index';
import { spaceDropdown } from '../common/props';
import { circleAuth } from '../../index';

export const findMemberByEmailAction = createAction({
  name: 'find_member_by_email',
  auth: circleAuth,
  displayName: 'Find Member by Email',
  description: 'Validate if a member exists in a Circle space before adding to workflows or sending messages.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the member to search for',
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
      HttpMethod.GET,
      `/space_member?${query}`
    );
  },
});
