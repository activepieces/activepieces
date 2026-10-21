import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, optionalText, pagingInput, triStateValue } from '../../common/props';
import { labelListOutputSchema } from '../../output-schemas-admin';

export const listLabelsAction = createAction({
  auth: gitlabAuth,
  name: 'list_labels',
  displayName: 'List Labels',
  description: 'Lists the labels of a project, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the labels available in a GitLab project, including labels inherited from parent groups unless Include Group Labels is no, with optional name search. Returns one page plus nextPage/hasMore. Use to check a label exists before Create Label or Update Issue.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    search: adminProps.search('Matches the label name.'),
    includeAncestorGroups: gitlabProps.triState('Include Group Labels', 'Leave empty for the GitLab default (yes).'),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: labelListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({ auth, 
      path: `${projectPath(propsValue.projectId)}/labels`,
      query: { search: optionalText(propsValue.search), include_ancestor_groups: triStateValue(propsValue.includeAncestorGroups) },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
