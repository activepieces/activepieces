import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeCircleRequest } from '../common/index';
import { memberDropdown } from '../common/props';
import { circleAuth } from '../../index';

export const getMemberDetailsAction = createAction({
  name: 'get_member_details',
  auth: circleAuth,
  displayName: 'Get Member Details',
  description: 'Fetch full member profiles for use in custom dashboards or integrations.',
  props: {
    memberId: memberDropdown,
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
