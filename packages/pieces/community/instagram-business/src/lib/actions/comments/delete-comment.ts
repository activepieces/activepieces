import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { identifierResultOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const deleteComment = createAction({
  auth: instagramCommon.authentication,
  outputSchema: identifierResultOutputSchema,
  name: 'delete_comment',
  classification: 'WRITE',
  displayName: 'Delete Comment',
  description: 'Permanently delete a comment.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one Instagram comment by its id. This cannot be undone, and only comments on the connected account\u2019s own media can be deleted. To silence a comment reversibly, use Hide Comment instead. Not idempotent — deleting an already deleted comment fails.',
    idempotent: false,
  },
  props: {
    page: instagramCommon.page,
    comment_id: Property.ShortText({ displayName: 'Comment ID', required: true }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const result = await instagramCommon.graphRequest<{ success?: boolean }>({
      method: HttpMethod.DELETE,
      resourceUri: `/${propsValue.comment_id}`,
      accessToken: page.accessToken,
    });

    return { success: result.success ?? true, id: propsValue.comment_id };
  },
});
