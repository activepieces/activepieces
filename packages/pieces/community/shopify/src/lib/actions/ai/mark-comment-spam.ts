import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlComment,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiMarkCommentSpam = createAction({
  auth: shopifyAuth,
  name: 'mark_comment_spam',
  classification: 'WRITE',
  displayName: 'Mark Blog Comment as Spam',
  description: 'Mark a blog comment as spam so it is hidden.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Marks one blog comment as spam, which hides it from the article, and returns the comment with its new status. Reversible with mark_comment_not_spam. Marking a comment that is already spam leaves it as spam, so repeating is safe. Author details may be null without protected customer data access. Needs the write_content access scope.',
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
      commentSpam: { comment: GqlComment | null } | null;
    }>({
      auth,
      query: `mutation MarkCommentSpam($id: ID!) { commentSpam(id: $id) { comment { ${shopifyFields.COMMENT_FIELDS} } userErrors { field message code } } }`,
      variables: { id },
    });
    const comment = data.commentSpam?.comment;
    if (!comment) {
      throw new Error('Shopify did not return the comment.');
    }
    return {
      ...shopifyMappers.mapComment(comment),
      redacted_fields: redactedFields,
    };
  },
});
