import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon, GraphRecord } from '../../common/common';
import { createPagePhotoPostOutputSchema } from '../../output-schemas';

export const createPagePhotoPostAction = createAction({
  auth: facebookPagesAuth,
  name: 'create_page_photo_post',
  classification: 'WRITE',
  displayName: 'Create Page Photo Post',
  description: 'Publishes a photo post on a Facebook Page from an image URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publish a single photo to a Facebook Page from a publicly reachable image URL, with an optional caption. Returns both the photo ID and the post_id (PageID_PostID); use post_id for Get Post, Update Post and Delete Post. Use Create Multi-Photo Post for several images in one post. Not idempotent: each call creates a new post.',
    idempotent: false,
  },
  outputSchema: createPagePhotoPostOutputSchema,
  props: {
    pageId: facebookPagesCommon.pageId,
    photoUrl: Property.ShortText({
      displayName: 'Photo URL',
      description: 'A public URL of the image that Facebook can download (JPEG, PNG, GIF, BMP or TIFF, up to 4 MB).',
      required: true,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Text shown with the photo.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return facebookPagesCommon.pageRequest<GraphRecord>({
      auth,
      pageId: propsValue.pageId,
      method: HttpMethod.POST,
      path: `${facebookPagesCommon.objectPath({ id: propsValue.pageId })}/photos`,
      body: { url: propsValue.photoUrl.trim(), caption: propsValue.caption },
    });
  },
});
