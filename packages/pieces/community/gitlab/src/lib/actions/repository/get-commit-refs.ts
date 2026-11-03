import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import {
  encodeSegment,
  gitlabListPage,
  projectPath,
} from '../../common/client';
import { gitlabProps, pagingInput } from '../../common/props';
import { commitRefListOutputSchema } from '../../output-schemas';

export const getCommitRefsAction = createAction({
  auth: gitlabAuth,
  name: 'get_commit_refs',
  displayName: 'Get Commit Branches and Tags',
  description: 'Lists the branches and tags that contain a commit.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the branches and/or tags of a GitLab repository that contain a given commit, e.g. to check whether a fix reached a release branch. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    sha: gitlabProps.sha(),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Branches', value: 'branch' },
          { label: 'Tags', value: 'tag' },
        ],
      },
    }),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: commitRefListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({
      auth,
      path: `${projectPath(
        propsValue.projectId
      )}/repository/commits/${encodeSegment({
        value: propsValue.sha,
        label: 'Commit SHA',
      })}/refs`,
      query: { type: propsValue.type ?? 'all' },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
