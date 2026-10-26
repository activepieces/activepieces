import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { commentOnDiscussionOutputSchema } from '../output-schemas';

export const commentOnDiscussion = createAction({
  auth: huggingFaceAuth,
  name: 'comment_on_discussion',
  classification: 'WRITE',
  displayName: 'Comment on Discussion',
  description: 'Post a comment on a discussion or pull request of a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Posts a new comment on an existing discussion or pull request of a model, dataset or Space repository, publicly under the connected user's name. Get the discussion number from List Discussions & PRs. Each call adds another comment, so retries duplicate. Requires a write-role token.",
    idempotent: false,
  },
  outputSchema: commentOnDiscussionOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    discussion_number: Property.Number({
      displayName: 'Discussion Number',
      description: "The discussion or pull request number within the repository (the 'num' from List Discussions & PRs).",
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The comment text, in Markdown (up to 65,536 characters).',
      required: true,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, discussion_number, comment } = context.propsValue;
    const token = context.auth.secret_text;
    const num = hfWrite.assertDiscussionNumber(discussion_number);
    const text = hfWrite.requireText({ value: comment, name: 'Comment', maxLength: 65536 });
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    const response = await hfWrite.request({
      token,
      method: HttpMethod.POST,
      path: `${repo.apiPath}/discussions/${num}/comment`,
      body: { comment: text },
    });
    const newMessage = hfHub.isRecord(response) ? response['newMessage'] : undefined;
    const commentId = hfWrite.readString({ record: newMessage, key: 'id' });
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      discussion_number: num,
      comment_id: commentId,
      created_at: hfWrite.readString({ record: newMessage, key: 'createdAt' }),
      url: `${repo.webUrl}/discussions/${num}${commentId ? `#${commentId}` : ''}`,
    };
  },
});
