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
      'Reads one Instagram comment by its id, returning its text, author, timestamp, like count, hidden state and the media it belongs to. Use it after a New Comment trigger or List Comments. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      required: true,
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
