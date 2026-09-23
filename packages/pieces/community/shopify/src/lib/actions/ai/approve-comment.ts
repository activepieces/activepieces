import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlComment,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiApproveComment = createAction({
  auth: shopifyAuth,
  name: 'approve_comment',
  classification: 'WRITE',
  displayName: 'Approve Blog Comment',
  description: 'Approve a blog comment so it is published on the article.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Approves one blog comment (for example one listed by list_comments with "status:pending") so it shows on the article, and returns the comment with its new status. Approving an already published comment leaves it published, so repeating is safe. Author details may be null without protected customer data access. Needs the write_content access scope.',
    idempotent: true,
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
      commentApprove: { comment: GqlComment | null } | null;
    }>({
      auth,
      query: `mutation ApproveComment($id: ID!) { commentApprove(id: $id) { comment { ${shopifyFields.COMMENT_FIELDS} } userErrors { field message code } } }`,
      variables: { id },
    });
    const comment = data.commentApprove?.comment;
    if (!comment) {
      throw new Error('Shopify did not return the approved comment.');
    }
    return {
      ...shopifyMappers.mapComment(comment),
      redacted_fields: redactedFields,
    };
  },
});
