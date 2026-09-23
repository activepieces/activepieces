import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiDeleteComment = createAction({
  auth: shopifyAuth,
  name: 'delete_comment',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Blog Comment',
  description: 'Permanently delete a blog comment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one blog comment. To hide unwanted comments reversibly, use mark_comment_spam instead. Cannot be undone; a repeat call fails because the comment is gone. Needs the write_content access scope.',
    idempotent: false,
  },
  props: {
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'The comment id, numeric or "gid://shopify/Comment/…". Find it with list_comments.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Comment', id: propsValue.comment_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      commentDelete: { deletedCommentId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteComment($id: ID!) { commentDelete(id: $id) { deletedCommentId userErrors { field message code } } }`,
      variables: { id },
    });
    return {
      deleted_comment_id: data.commentDelete?.deletedCommentId ?? id,
      redacted_fields: redactedFields,
    };
  },
});
