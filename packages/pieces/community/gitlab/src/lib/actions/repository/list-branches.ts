import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, optionalText, pagingInput } from '../../common/props';
import { branchListOutputSchema } from '../../output-schemas';

export const listBranchesAction = createAction({
  auth: gitlabAuth,
  name: 'list_branches',
  displayName: 'List Branches',
  description: 'Lists or searches the branches of the repository.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists branches of a GitLab repository, optionally filtered by a search term (use ^term or term$ to match the start or end). Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    search: Property.ShortText({ displayName: 'Search', required: false }),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: branchListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({
      auth,
      path: `${projectPath(propsValue.projectId)}/repository/branches`,
      query: { search: optionalText(propsValue.search) },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
