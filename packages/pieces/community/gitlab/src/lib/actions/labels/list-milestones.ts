import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, optionalText, pagingInput, triStateValue } from '../../common/props';
import { milestoneListOutputSchema } from '../../output-schemas-admin';

export const listMilestonesAction = createAction({
  auth: gitlabAuth,
  name: 'list_milestones',
  displayName: 'List Milestones',
  description: 'Lists the milestones of a project, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists GitLab project milestones with optional state (active or closed), exact title and text search filters. Returns one page plus nextPage/hasMore. Each item has the global id (used by Get Milestone, Update Milestone and Update Issue) and the iid.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    state: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      options: { options: [{ label: 'Active', value: 'active' }, { label: 'Closed', value: 'closed' }] },
    }),
    title: Property.ShortText({ displayName: 'Exact Title', required: false }),
    search: adminProps.search('Matches title and description.'),
    includeAncestors: gitlabProps.triState('Include Group Milestones', 'Also list milestones of parent groups.'),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: milestoneListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({ auth, 
      path: `${projectPath(propsValue.projectId)}/milestones`,
      query: {
        state: propsValue.state,
        title: optionalText(propsValue.title),
        search: optionalText(propsValue.search),
        include_ancestors: triStateValue(propsValue.includeAncestors),
      },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
