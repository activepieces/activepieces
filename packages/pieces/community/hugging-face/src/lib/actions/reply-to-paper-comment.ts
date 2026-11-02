import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfWrite } from '../common/hub-write';
import { replyToPaperCommentOutputSchema } from '../output-schemas';

export const replyToPaperComment = createAction({
  auth: huggingFaceAuth,
  name: 'reply_to_paper_comment',
  classification: 'WRITE',
  displayName: 'Reply to Paper Comment',
  description: 'Post a public reply to a comment on a research paper page on Hugging Face.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Posts a reply under an existing comment on a Hugging Face Papers page, publicly and permanently visible to everyone under the connected user's name. Only post when the user explicitly asks and approves the text. Get the comment ID from Get Paper with Include Comments on. Each call adds another reply, so retries duplicate. Requires a write-role token.",
    idempotent: false,
  },
  outputSchema: replyToPaperCommentOutputSchema,
  props: {
    paper_id: Property.ShortText({
      displayName: 'Paper ID',
      description: "The paper's arXiv ID, for example '2307.09288'.",
      required: true,
    }),
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description: 'The ID of the comment to reply to, from Get Paper with Include Comments on.',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Reply',
      description: 'The public reply text, in Markdown (up to 65,536 characters).',
      required: true,
    }),
  },
  async run(context) {
    const { paper_id, comment_id, comment } = context.propsValue;
    const paperId = hfWrite.requireText({ value: paper_id, name: 'Paper ID' });
    const parentId = hfWrite.requireText({ value: comment_id, name: 'Comment ID' });
    const text = hfWrite.requireText({ value: comment, name: 'Reply', maxLength: 65536 });
    const response = await hfWrite.request({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/api/papers/${encodeURIComponent(paperId)}/comment/${encodeURIComponent(parentId)}/reply`,
      body: { comment: text },
    });
    const newMessage = hfHub.isRecord(response) ? response['newMessage'] : undefined;
    const replyId = hfWrite.readString({ record: newMessage, key: 'id' });
    return {
      paper_id: paperId,
      parent_comment_id: parentId,
      comment_id: replyId,
      created_at: hfWrite.readString({ record: newMessage, key: 'createdAt' }),
      url: `${hfHub.baseUrl}/papers/${encodeURIComponent(paperId)}${replyId ? `#${replyId}` : ''}`,
    };
  },
});
