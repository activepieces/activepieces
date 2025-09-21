import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';

export const findProjectAction = createAction({
  auth: capsuleCrmAuth,
  name: 'find_project',
  displayName: 'Find Project',
  description: 'Find a project by its name or other criteria.',
  props: {
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description: 'The text to search for in the project name.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const projects = await capsuleCrmClient.findProject(auth, {
      searchTerm: propsValue.search_term,
    });

    return projects;
  },
});
