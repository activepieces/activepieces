import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlComment,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiMarkCommentNotSpam = createAction({
  auth: shopifyAuth,
  name: 'mark_comment_not_spam',
  classification: 'WRITE',
  displayName: 'Mark Blog Comment as Not Spam',
  description: 'Restore a blog comment that was marked as spam.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Marks one blog comment as not spam, undoing mark_comment_spam, and returns the comment with its new status (it may still need approve_comment to be published, depending on the blog\'s comment policy). Repeating leaves the same state, so it is safe. Author details may be null without protected customer data access. Needs the write_content access scope.',
    idempotent: true,
  },
  props: {
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'The comment id, numeric or "gid://shopify/Comment/…". Find it with list_comments ("status:spam").',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Comment', id: propsValue.comment_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      commentNotSpam: { comment: GqlComment | null } | null;
    }>({
      auth,
      query: `mutation MarkCommentNotSpam($id: ID!) { commentNotSpam(id: $id) { comment { ${shopifyFields.COMMENT_FIELDS} } userErrors { field message code } } }`,
      variables: { id },
    });
    const comment = data.commentNotSpam?.comment;
    if (!comment) {
      throw new Error('Shopify did not return the comment.');
    }
    return {
      ...shopifyMappers.mapComment(comment),
      redacted_fields: redactedFields,
    };
  },
});
