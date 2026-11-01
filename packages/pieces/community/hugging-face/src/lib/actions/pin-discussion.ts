import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { pinDiscussionOutputSchema } from '../output-schemas';

export const pinDiscussion = createAction({
  auth: huggingFaceAuth,
  name: 'pin_discussion',
  classification: 'WRITE',
  displayName: 'Pin or Unpin Discussion',
  description: 'Pin a discussion to the top of a repository Community tab, or unpin it.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Pins a discussion or pull request to the top of a model, dataset or Space repository's Community tab, or unpins it. Setting the same state again is a no-op, so it is safe to retry. Requires a write-role token with write or admin rights on the repository.",
    idempotent: true,
  },
  outputSchema: pinDiscussionOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    discussion_number: Property.Number({
      displayName: 'Discussion Number',
      description: "The discussion or pull request number within the repository (the 'num' from List Discussions & PRs).",
      required: true,
    }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'Pin or unpin the discussion.',
      required: true,
      defaultValue: 'pin',
      options: {
        disabled: false,
        options: [
          { label: 'Pin', value: 'pin' },
          { label: 'Unpin', value: 'unpin' },
        ],
      },
    }),
  },
  async run(context) {
    const { repo_type, repo_id, discussion_number, action } = context.propsValue;
    const token = context.auth.secret_text;
    const num = hfWrite.assertDiscussionNumber(discussion_number);
    if (action !== 'pin' && action !== 'unpin') {
      throw new Error("Action must be 'pin' or 'unpin'.");
    }
    const pinned = action === 'pin';
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    await hfWrite.request({
      token,
      method: HttpMethod.POST,
      path: `${repo.apiPath}/discussions/${num}/pin`,
      body: { pinned },
    });
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      discussion_number: num,
      pinned,
    };
  },
});
