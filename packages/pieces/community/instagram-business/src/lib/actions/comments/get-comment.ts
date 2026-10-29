import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { getCommentOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown, COMMENT_FIELDS } from '../../common';

export const getComment = createAction({
  auth: instagramCommon.authentication,
  outputSchema: getCommentOutputSchema,
  name: 'get_comment',
  classification: 'READ',
  displayName: 'Get Comment',
  description: 'Read a single comment by its id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads one Instagram comment by its id, returning its text, author, timestamp, like count, hidden state and the media it belongs to. Use it after List Comments or List Comment Replies. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'account', display: 'section', label: 'Account', icon: 'user', props: ['page'] },
    { key: 'comment', display: 'section', label: 'Comment to read', icon: 'reply', props: ['comment_id'] },
  ],
  props: {
    page: instagramCommon.page,
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'The id from List Comments or another comment step.',
      required: true,
      placeholder: '17858893269000001',
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    return instagramCommon.graphRequest({
      method: HttpMethod.GET,
      resourceUri: `/${propsValue.comment_id}`,
      accessToken: page.accessToken,
      query: { fields: COMMENT_FIELDS },
    });
  },
});
