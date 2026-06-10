import { createAction } from '@activepieces/pieces-framework';
import { facebookPagesCommon, FacebookPageDropdown } from '../common/common';
import { facebookPagesAuth } from '../..';

export const createPost = createAction({
  auth: facebookPagesAuth,
  name: 'create_post',
  displayName: 'Create Page Post',
  description: 'Create a post on a Facebook Page you manage',
  audience: 'both',
  aiMetadata: { description: 'Publishes a text status update to the feed of a Facebook Page the connected account manages, optionally attaching a link that Facebook will render as a preview card. Choose this for plain-text or link announcements; use the photo or video post actions for media uploads. Requires selecting a managed page (which supplies the page-scoped access token) and a message; not idempotent, as each call publishes a separate post.', idempotent: false },
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
