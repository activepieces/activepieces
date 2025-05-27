import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { fetchMembers, makeCircleRequest } from '../common';
import { circleAuth } from '../../index';

export const getMemberDetailsAction = createAction({
  name: 'get_member_details',
  auth: circleAuth,
  displayName: 'Get Member Details',
  description: 'Fetch full member profiles for use in custom dashboards or integrations.',
  props: {
    memberId: Property.Dropdown({
      displayName: 'Member',
      description: 'The community member to retrieve details for',
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
        const members = await fetchMembers(apiKey);

        return {
          options: members.map((member: any) => ({
            label: `${member.name} (${member.email})`,
            value: member.id.toString(),
          })),
        };
      },
    }),
  },
  async run(context) {
    const { memberId } = context.propsValue;

    return await makeCircleRequest(
      context.auth as string,
      HttpMethod.GET,
      `/community_members/${memberId}`
    );
  },
});
