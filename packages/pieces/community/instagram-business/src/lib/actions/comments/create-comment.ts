import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { commentCreatedOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const createComment = createAction({
  auth: instagramCommon.authentication,
  outputSchema: commentCreatedOutputSchema,
  name: 'create_comment',
  classification: 'WRITE',
  displayName: 'Create Comment',
  description: 'Post a comment on one of your Instagram posts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Posts a new top-level comment on one of the connected account\u2019s own Instagram posts. To answer an existing comment use Reply To Comment instead, which threads the response. Not idempotent — each call posts another comment.',
    idempotent: false,
  },
  props: {
    page: instagramCommon.page,
    media_id: Property.ShortText({ displayName: 'Media ID', required: true }),
    message: Property.LongText({ displayName: 'Comment', required: true }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const created = await instagramCommon.graphRequest<{ id?: string }>({
      method: HttpMethod.POST,
      resourceUri: `/${propsValue.media_id}/comments`,
      accessToken: page.accessToken,
      body: { message: propsValue.message },
    });

    return { id: created.id, media_id: propsValue.media_id };
  },
});
