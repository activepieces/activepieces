import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../auth';
import { facebookPagesCommon } from '../common/common';
import { createPhotoPostActionOutputSchema } from '../output-schemas';

export const createPhotoPost = createAction({
  auth: facebookPagesAuth,
  name: 'create_photo_post',
  classification: 'WRITE',
  displayName: 'Create Page Photo',
  description: 'Create a photo on a Facebook Page you manage',
  audience: 'human',
  aiMetadata: { description: 'Publishes a photo post to a Facebook Page the connected account manages by uploading an image from a publicly reachable URL, with an optional caption. Choose this when the post is an image rather than plain text or video. Requires a managed page and a photo URL that Facebook can fetch; not idempotent, as each call creates a new photo post.', idempotent: false },
  outputSchema: createPhotoPostActionOutputSchema,
  props: {
    page: facebookPagesCommon.page,
    photo: facebookPagesCommon.photo,
    caption: facebookPagesCommon.caption,
  },
  async run({ propsValue }) {
    return facebookPagesCommon.graphRequest({
      accessToken: propsValue.page.accessToken,
      method: HttpMethod.POST,
      path: `${facebookPagesCommon.objectPath({ id: propsValue.page.id })}/photos`,
      body: { url: propsValue.photo, caption: propsValue.caption },
    });
  },
});
