import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { createDiscussionOutputSchema } from '../output-schemas';

export const createDiscussion = createAction({
  auth: huggingFaceAuth,
  name: 'create_discussion',
  classification: 'WRITE',
  displayName: 'Create Discussion',
  description: 'Open a new discussion or draft pull request on a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Opens a new discussion thread on a model, dataset or Space repository, posted publicly under the connected user's name (visible to everyone who can see the repository). With Open as Pull Request it instead opens an empty draft pull request: add files to it with Commit Files using the returned pull_request_revision (refs/pr/N) as the branch, or use Commit Files with Open as Pull Request to do both in one step. Each call creates a new thread, so retries duplicate. Requires a write-role token.",
    idempotent: false,
  },
  outputSchema: createDiscussionOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The discussion title, 3 to 200 characters.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The opening message, in Markdown (up to 65,536 characters).',
      required: true,
    }),
    pull_request: Property.Checkbox({
      displayName: 'Open as Pull Request',
      description: 'Open an empty draft pull request instead of a discussion.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, title, description, pull_request } = context.propsValue;
    const token = context.auth.secret_text;
    const discussionTitle = hfWrite.requireText({ value: title, name: 'Title', maxLength: 200 });
    if (discussionTitle.length < 3) {
      throw new Error('Title must be at least 3 characters.');
    }
    const message = hfWrite.requireText({ value: description, name: 'Description', maxLength: 65536 });
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    const response = await hfWrite.request({
      token,
      method: HttpMethod.POST,
      path: `${repo.apiPath}/discussions`,
      body: { title: discussionTitle, description: message, pullRequest: pull_request === true },
    });
    const body = hfHub.isRecord(response) ? response : {};
    const num = typeof body['num'] === 'number' ? body['num'] : null;
    const isPullRequest = body['pullRequest'] === true;
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      discussion_number: num,
      title: discussionTitle,
      is_pull_request: isPullRequest,
      pull_request_revision: isPullRequest && num !== null ? `refs/pr/${num}` : null,
      url:
        typeof body['url'] === 'string'
          ? body['url']
          : num !== null
            ? `${repo.webUrl}/discussions/${num}`
            : null,
    };
  },
});
