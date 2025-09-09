import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubSearchIssuesAction = createAction({
  auth: githubAuth,
  name: 'searchIssues',
  displayName: 'Search Issues',
  description: 'Search issues and pull requests across GitHub',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Search query, e.g., repo:owner/name is:issue state:open label:bug',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { query } = propsValue as any;
    const response = await githubApiCall({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      resourceUri: `/search/issues`,
      query: { q: query },
    });
    return response;
  },
});

