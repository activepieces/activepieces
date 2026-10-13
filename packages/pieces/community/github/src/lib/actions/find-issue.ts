import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { findIssueActionOutputSchema } from '../output-schemas';

export const githubFindIssueAction = createAction({
  auth: githubAuth,
  name: 'find_issue',
  classification: 'SEARCH',
  displayName: 'Find Issue',
  description: 'Finds the first issue whose title matches your text.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches a repository for an issue whose title matches the given text, filtered by state (open, closed, or all), and returns the top match plus whether any was found. Use to locate an issue by title when you do not have its number. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'filter',
      props: ['repository', 'title', 'state'],
    },
  ],
  props: {
    repository: githubCommon.repositoryDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Words to look for in issue titles.',
      placeholder: 'Login error',
      required: true,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      description: 'Which issues to search.',
      required: true,
      display: 'cards',
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
  },
  outputSchema: findIssueActionOutputSchema,
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue.repository!;
    const { state, title } = propsValue;
    const phrase = title.replace(/["\\]/g, ' ');

    let q = `repo:${owner}/${repo} is:issue in:title "${phrase}"`;
    if (state && state !== 'all') {
      q += ` state:${state}`;
    }

    const response = await githubApiCall<{
      total_count: number;
      items: Array<{ id: number }>;
    }>({
      auth,
      method: HttpMethod.GET,
      resourceUri: `/search/issues`,
      query: { q, per_page: 1 },
    });

    return {
      found: response.body.total_count > 0,
      result: response.body.items,
    };
  },
});
