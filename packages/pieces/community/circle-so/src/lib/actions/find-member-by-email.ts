import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { fetchSpaces, makeCircleRequest } from '../common';
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
    spaceId: Property.Dropdown({
      displayName: 'Space',
      description: 'The space to search for the member in',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Circle.so account',
            options: [],
          };
        }

        const apiKey = auth as string;
        const spaces = await fetchSpaces(apiKey);

        return {
          options: spaces.map((space: any) => ({
            label: space.name,
            value: space.id.toString(),
          })),
        };
      },
    }),
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
