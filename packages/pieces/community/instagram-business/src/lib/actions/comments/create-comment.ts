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
      'Posts a new top-level comment on one of the connected account\u2019s own Instagram posts. To answer an existing comment use Reply to Comment instead, which threads the response. Not idempotent — each call posts another comment.',
    idempotent: false,
  },
  propertyGroups: [
    { key: 'account', display: 'section', label: 'Account', icon: 'user', props: ['page'] },
    { key: 'media', display: 'section', label: 'Post to comment on', icon: 'file', props: ['media_id'] },
    { key: 'comment', display: 'section', label: 'Comment', icon: 'text', props: ['message'] },
  ],
  props: {
    page: instagramCommon.page,
    media_id: Property.ShortText({
      displayName: 'Media ID',
      description: 'The id from List Media or a publish step.',
      required: true,
      placeholder: '17895695668004550',
    }),
    message: Property.LongText({
      displayName: 'Text',
      required: true,
      placeholder: 'Thanks for all the love on this one!',
    }),
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
