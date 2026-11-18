import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';

import { identifierResultOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const deleteComment = createAction({
  auth: instagramCommon.authentication,
  outputSchema: identifierResultOutputSchema,
  name: 'delete_comment',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Comment',
  description: 'Permanently delete a comment.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one Instagram comment by its id. This cannot be undone, and only comments on the connected account\u2019s own media can be deleted. To silence a comment reversibly, use Hide or Unhide Comment instead. Not idempotent — deleting an already deleted comment fails.',
    idempotent: false,
  },
  propertyGroups: [
    { key: 'account', display: 'section', label: 'Account', icon: 'user', props: ['page'] },
    { key: 'comment', display: 'section', label: 'Comment to delete', icon: 'trash', props: ['comment_id', 'delete_info'] },
  ],
  props: {
    page: instagramCommon.page,
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'The id from List Comments or another comment step.',
      required: true,
      placeholder: '17858893269000001',
    }),
    delete_info: Property.MarkDown({
      value: "Deleted comments can't be restored.",
      variant: MarkdownVariant.INFO,
    }),
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
