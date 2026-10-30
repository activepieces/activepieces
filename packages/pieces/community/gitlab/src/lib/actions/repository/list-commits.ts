import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import {
  gitlabProps,
  optionalIsoDate,
  optionalText,
  pagingInput,
} from '../../common/props';
import { commitListOutputSchema } from '../../output-schemas';

export const listCommitsAction = createAction({
  auth: gitlabAuth,
  name: 'list_commits',
  displayName: 'List Commits',
  description: 'Lists the commits of a branch, tag or path, newest first.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists commits in a GitLab repository, newest first, optionally limited to a branch or tag, a file path, an author and a date range. Defaults to the default branch. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    refName: Property.ShortText({
      displayName: 'Branch or Tag',
      description: 'Defaults to the default branch.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'File Path',
      description: 'Only commits that touch this path.',
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'Author name or email.',
      required: false,
    }),
    since: Property.ShortText({
      displayName: 'Since',
      description: 'ISO 8601 date-time.',
      required: false,
    }),
    until: Property.ShortText({
      displayName: 'Until',
      description: 'ISO 8601 date-time.',
      required: false,
    }),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: commitListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({
      auth,
      path: `${projectPath(propsValue.projectId)}/repository/commits`,
      query: {
        ref_name: optionalText(propsValue.refName),
        path: optionalText(propsValue.path),
        author: optionalText(propsValue.author),
        since: optionalIsoDate({ value: propsValue.since, label: 'Since' }),
        until: optionalIsoDate({ value: propsValue.until, label: 'Until' }),
      },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
