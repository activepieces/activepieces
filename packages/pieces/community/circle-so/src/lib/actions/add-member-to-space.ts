import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { fetchSpaces, makeCircleRequest } from '../common';
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
    spaceId: Property.Dropdown({
      displayName: 'Space',
      description: 'The Circle space to add the member to',
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
      HttpMethod.POST,
      `/space_members?${query}`
    );
  },
});
