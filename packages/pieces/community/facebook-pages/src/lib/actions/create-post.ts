import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../auth';
import { facebookPagesCommon } from '../common/common';
import { createPostActionOutputSchema } from '../output-schemas';

export const createPost = createAction({
  auth: facebookPagesAuth,
  name: 'create_post',
  classification: 'WRITE',
  displayName: 'Create Page Post',
  description: 'Create a post on a Facebook Page you manage',
  audience: 'human',
  aiMetadata: { description: 'Publishes a text status update to the feed of a Facebook Page the connected account manages, optionally attaching a link that Facebook will render as a preview card. Choose this for plain-text or link announcements; use the photo or video post actions for media uploads. Requires selecting a managed page (which supplies the page-scoped access token) and a message; not idempotent, as each call publishes a separate post.', idempotent: false },
  outputSchema: createPostActionOutputSchema,
  props: {
    page: facebookPagesCommon.page,
    message: facebookPagesCommon.message,
    link: facebookPagesCommon.link,
  },
  async run({ propsValue }) {
    return facebookPagesCommon.graphRequest({
      accessToken: propsValue.page.accessToken,
      method: HttpMethod.POST,
      path: `${facebookPagesCommon.objectPath({ id: propsValue.page.id })}/feed`,
      body: { message: propsValue.message, link: propsValue.link },
    });
  },
});
