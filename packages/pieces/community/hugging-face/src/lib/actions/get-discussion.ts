import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { getDiscussionOutputSchema } from '../output-schemas';

export const getDiscussion = createAction({
  auth: huggingFaceAuth,
  name: 'get_discussion',
  classification: 'READ',
  displayName: 'Get Discussion or PR',
  description: 'Get one discussion or pull request of a Hub repository, with its comments and events.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns one discussion or pull request of a Hub repository by its per-repository number: title, status, author, every comment and status/title event and, for pull requests, the diff URL, target branch and merge info. Get the number from List Discussions & PRs. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getDiscussionOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    discussion_number: Property.Number({
      displayName: 'Discussion Number',
      description: "The discussion or pull request number within the repository, for example 12 (the 'num' from List Discussions & PRs).",
      required: true,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, discussion_number } = context.propsValue;
    if (!Number.isInteger(discussion_number) || discussion_number < 1) {
      throw new Error('Discussion Number must be a positive whole number.');
    }
    const token = context.auth.secret_text;
    const apiPath = await hfRepo.apiPath({ token, repoType: repo_type, repoId: repo_id });
    const response = await hfHub.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${apiPath}/discussions/${discussion_number}`,
    });
    return response.body;
  },
});
