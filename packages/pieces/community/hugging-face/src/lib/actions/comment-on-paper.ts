import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfWrite } from '../common/hub-write';

export const commentOnPaper = createAction({
  auth: huggingFaceAuth,
  name: 'comment_on_paper',
  classification: 'WRITE',
  displayName: 'Comment on Paper',
  description: 'Post a public comment on a research paper page on Hugging Face.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Posts a new top-level comment on a Hugging Face Papers page, publicly and permanently visible to everyone under the connected user's name. Only post when the user explicitly asks and approves the text. To answer an existing comment use Reply to Paper Comment instead. Each call adds another comment, so retries duplicate. Requires a write-role token.",
    idempotent: false,
  },
  props: {
    paper_id: Property.ShortText({
      displayName: 'Paper ID',
      description: "The paper's arXiv ID, for example '2307.09288'. Find it with Search Papers or List Daily Papers.",
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The public comment text, in Markdown (up to 65,536 characters).',
      required: true,
    }),
  },
  async run(context) {
    const { paper_id, comment } = context.propsValue;
    const paperId = hfWrite.requireText({ value: paper_id, name: 'Paper ID' });
    const text = hfWrite.requireText({ value: comment, name: 'Comment', maxLength: 65536 });
    const response = await hfWrite.request({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/api/papers/${encodeURIComponent(paperId)}/comment`,
      body: { comment: text },
    });
    const newMessage = hfHub.isRecord(response) ? response['newMessage'] : undefined;
    const commentId = hfWrite.readString({ record: newMessage, key: 'id' });
    return {
      paper_id: paperId,
      comment_id: commentId,
      created_at: hfWrite.readString({ record: newMessage, key: 'createdAt' }),
      url: `${hfHub.baseUrl}/papers/${encodeURIComponent(paperId)}${commentId ? `#${commentId}` : ''}`,
    };
  },
});
