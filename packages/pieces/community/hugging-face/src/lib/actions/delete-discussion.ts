import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { deleteDiscussionOutputSchema } from '../output-schemas';

export const deleteDiscussion = createAction({
  auth: huggingFaceAuth,
  name: 'delete_discussion',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Discussion',
  description: 'Permanently delete a discussion or pull request from a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Permanently deletes a discussion or pull request, with all its comments, from a model, dataset or Space repository; it cannot be undone. Prefer Open or Close Discussion (closed) unless the user explicitly asks to delete. A retry after success fails because the thread is gone. Requires a write-role token with admin rights on the repository.",
    idempotent: false,
  },
  outputSchema: deleteDiscussionOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    discussion_number: Property.Number({
      displayName: 'Discussion Number',
      description: "The discussion or pull request number within the repository (the 'num' from List Discussions & PRs).",
      required: true,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, discussion_number } = context.propsValue;
    const token = context.auth.secret_text;
    const num = hfWrite.assertDiscussionNumber(discussion_number);
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    await hfWrite.request({
      token,
      method: HttpMethod.DELETE,
      path: `${repo.apiPath}/discussions/${num}`,
    });
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      discussion_number: num,
      deleted: true,
    };
  },
});
