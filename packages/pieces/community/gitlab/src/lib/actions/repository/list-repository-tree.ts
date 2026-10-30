import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import {
  gitlabProps,
  optionalText,
  pagingInput,
  triStateValue,
} from '../../common/props';
import { treeListOutputSchema } from '../../output-schemas';

export const listRepositoryTreeAction = createAction({
  auth: gitlabAuth,
  name: 'list_repository_tree',
  displayName: 'List Repository Files',
  description: 'Lists files and folders in the repository.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists files (blob) and folders (tree) in a GitLab repository at a path and branch/tag/commit, optionally recursively. Returns one page plus nextPage/hasMore. Use Get File to read a file found here.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    path: Property.ShortText({
      displayName: 'Folder Path',
      description: 'Defaults to the repository root.',
      required: false,
    }),
    ref: Property.ShortText({
      displayName: 'Branch, Tag or Commit',
      description: 'Defaults to the default branch.',
      required: false,
    }),
    recursive: gitlabProps.triState(
      'Recursive',
      'Include everything below the folder.'
    ),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: treeListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({
      auth,
      path: `${projectPath(propsValue.projectId)}/repository/tree`,
      query: {
        path: optionalText(propsValue.path),
        ref: optionalText(propsValue.ref),
        recursive: triStateValue(propsValue.recursive),
      },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
