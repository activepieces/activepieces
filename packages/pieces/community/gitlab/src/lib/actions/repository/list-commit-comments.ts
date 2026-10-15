import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import {
  encodeSegment,
  gitlabListPage,
  projectPath,
} from '../../common/client';
import { gitlabProps, pagingInput } from '../../common/props';
import { commitCommentListOutputSchema } from '../../output-schemas';

export const listCommitCommentsAction = createAction({
  auth: gitlabAuth,
  name: 'list_commit_comments',
  displayName: 'List Commit Comments',
  description: 'Lists the comments on a commit.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists comments on a GitLab commit, including line comments with their file path and line. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    sha: gitlabProps.sha(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: commitCommentListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({
      auth,
      path: `${projectPath(
        propsValue.projectId
      )}/repository/commits/${encodeSegment({
        value: propsValue.sha,
        label: 'Commit SHA',
      })}/comments`,
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
