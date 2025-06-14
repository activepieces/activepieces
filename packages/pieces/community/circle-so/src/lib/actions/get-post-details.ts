import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import  { postDropdown } from '../common/props';
import { makeCircleRequest } from '../common';
import { circleAuth } from '../../index';

export const getPostDetailsAction = createAction({
  name: 'get_post_details',
  auth: circleAuth,
  displayName: 'Get Post Details',
  description: 'Retrieve complete post content for replication or analysis.',
  props: {
    postId: postDropdown,
  },
  async run(context) {
    const { postId } = context.propsValue;

    return await makeCircleRequest(
      context.auth as string,
      HttpMethod.GET,
      `/posts/${postId}`
    );
  },
});
