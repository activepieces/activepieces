import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyCommon } from '../common/client';
import { markyProps } from '../common/props';

export const updatePostAction = createAction({
  auth: markyAuth,
  name: 'update_post',
  displayName: 'Update Post',
  description: "Update a post's caption, review status or target platforms.",
  audience: 'both',
  aiMetadata: {
    description:
      'Change the caption, the review status or the target platforms of an existing Marky post. Use Schedule Post to set a publish time instead — scheduling has its own endpoint, and published posts can no longer be changed. Updating to the same values is safe to retry.',
    idempotent: true,
  },
  props: {
    businessId: markyProps.businessId,
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The ID of the post to update, as returned by Create Post or List Posts.',
      required: true,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'New caption text. Leave empty to keep the current one.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Review Status',
      description:
        "Move the post through your team's review workflow. Only works while the post is New, Draft or Rejected.",
      required: false,
      options: {
        options: [
          { label: 'New (ready for review)', value: 'NEW' },
          { label: 'Draft (approved)', value: 'DRAFT' },
          { label: 'Rejected', value: 'REJECTED' },
        ],
      },
    }),
    restrictPublishTo: markyProps.restrictPublishTo,
  },
  async run(context) {
    const { businessId, postId, caption, status, restrictPublishTo } = context.propsValue;

    const hasPlatforms = restrictPublishTo !== undefined && restrictPublishTo.length > 0;
    if (!caption && !status && !hasPlatforms) {
      throw new Error('Provide at least a Caption, a Review Status or Platforms to update.');
    }

    const response = await markyCommon.apiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/businesses/${businessId}/posts/${postId}`,
      body: {
        ...(caption ? { caption } : {}),
        ...(status ? { status } : {}),
        ...(hasPlatforms ? { restrict_publish_to: restrictPublishTo } : {}),
      },
    });

    return response.body;
  },
});
