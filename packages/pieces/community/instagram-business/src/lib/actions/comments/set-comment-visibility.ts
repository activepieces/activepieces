import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { identifierResultOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const setCommentVisibility = createAction({
  auth: instagramCommon.authentication,
  outputSchema: identifierResultOutputSchema,
  name: 'set_comment_visibility',
  classification: 'WRITE',
  displayName: 'Hide or Unhide Comment',
  description: 'Hide a comment from public view, or unhide it again.',
  audience: 'both',
  aiMetadata: {
    description:
      'Hides an Instagram comment from everyone except its author, or unhides a previously hidden one, controlled by the Hidden toggle. Unlike Delete Comment this is reversible and the comment is not destroyed. Idempotent — setting the same state twice leaves the comment unchanged.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
    comment_id: Property.ShortText({ displayName: 'Comment ID', required: true }),
    hidden: Property.Checkbox({
      displayName: 'Hidden',
      description: 'On hides the comment, off makes it visible again.',
      required: true,
      defaultValue: true,
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const result = await instagramCommon.graphRequest<{ success?: boolean }>({
      method: HttpMethod.POST,
      resourceUri: `/${propsValue.comment_id}`,
      accessToken: page.accessToken,
      body: { hide: propsValue.hidden },
    });

    return { success: result.success ?? true, id: propsValue.comment_id };
  },
});
