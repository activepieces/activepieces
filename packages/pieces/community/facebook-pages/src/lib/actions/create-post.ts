import { createAction } from '@activepieces/pieces-framework';
import { facebookPagesCommon, FacebookPageDropdown } from '../common/common';
import { facebookPagesAuth } from '../..';

export const createPost = createAction({
  auth: facebookPagesAuth,
  name: 'create_post',
  displayName: 'Create Page Post',
  description: 'Create a post on a Facebook Page you manage',
  props: {
    page: facebookPagesCommon.page,
    message: facebookPagesCommon.message,
    link: facebookPagesCommon.link,
  },
  async run(context) {
    const page: FacebookPageDropdown = context.propsValue.page!;

    const result = await facebookPagesCommon.createPost(
      page,
      context.propsValue.message,
      context.propsValue.link
    );

    return result;
  },
});
