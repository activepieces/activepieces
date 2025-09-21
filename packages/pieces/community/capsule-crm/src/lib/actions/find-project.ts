import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';

export const findProjectAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_project',
  displayName: 'Find Project',
  description: 'Find projects by search criteria',
  
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Project name or description to search for',
      required: true,
    }),
  },

  async run(context) {
    const { searchTerm } = context.propsValue;

    const endpoint = `/projects?q=${encodeURIComponent(searchTerm)}`;

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      endpoint
    );

    return {
      projects: response.projects || [],
      total: response.projects?.length || 0,
    };
  },
});
