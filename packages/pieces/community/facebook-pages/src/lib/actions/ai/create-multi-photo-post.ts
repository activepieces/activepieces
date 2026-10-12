import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon } from '../../common/common';
import { createMultiPhotoPostOutputSchema } from '../../output-schemas';

export const createMultiPhotoPostAction = createAction({
  auth: facebookPagesAuth,
  name: 'create_multi_photo_post',
  classification: 'WRITE',
  displayName: 'Create Multi-Photo Post',
  description: 'Publishes one Facebook Page post containing several photos.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publish one feed post on a Facebook Page that contains 2 to 20 photos from public image URLs, with an optional message. Uploads each photo unpublished, then creates the post with them attached; if an upload fails no post is created, though earlier unpublished uploads can remain. Use Create Page Photo Post for a single photo. Not idempotent.',
    idempotent: false,
  },
  outputSchema: createMultiPhotoPostOutputSchema,
  props: {
    pageId: facebookPagesCommon.pageId,
    photoUrls: Property.Array({
      displayName: 'Photo URLs',
      description: 'Public image URLs that Facebook can download, 2 to 20 of them, in display order.',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Text of the post.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const photoUrls = (propsValue.photoUrls ?? [])
      .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
      .map((url) => url.trim());
    if (photoUrls.length < 2 || photoUrls.length > MAX_PHOTOS) {
      throw new Error(`Provide between 2 and ${MAX_PHOTOS} photo URLs.`);
    }
    const accessToken = await facebookPagesCommon.getPageAccessToken({ auth, pageId: propsValue.pageId });
    const pagePath = facebookPagesCommon.objectPath({ id: propsValue.pageId });
    const photos = await Promise.all(
      photoUrls.map((url) =>
        facebookPagesCommon.graphRequest<{ id: string }>({
          accessToken,
          method: HttpMethod.POST,
          path: `${pagePath}/photos`,
          body: { url, published: false },
        })
      )
    );
    const post = await facebookPagesCommon.graphRequest<{ id: string }>({
      accessToken,
      method: HttpMethod.POST,
      path: `${pagePath}/feed`,
      body: {
        message: propsValue.message,
        attached_media: photos.map((photo) => ({ media_fbid: photo.id })),
      },
    });
    return { post_id: post.id, photo_ids: photos.map((photo) => photo.id) };
  },
});

const MAX_PHOTOS = 20;
