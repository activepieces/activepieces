import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import {
  gitlabProps,
  pagingInput,
  requirePositiveInt,
} from '../../common/props';
import { commitListOutputSchema } from '../../output-schemas';

export const listMergeRequestCommitsAction = createAction({
  auth: gitlabAuth,
  name: 'list_merge_request_commits',
  displayName: 'List Merge Request Commits',
  description: 'Lists the commits of a merge request.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the commits in a GitLab merge request, newest first. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: commitListOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.mergeRequestIid,
      label: 'Merge Request IID',
    });
    return gitlabListPage({
      auth,
      path: `${projectPath(
        propsValue.projectId
      )}/merge_requests/${iid}/commits`,
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
