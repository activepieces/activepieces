import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { capsuleCrmProps } from '../common/props';

export const findProjectAction = createAction({
  auth: capsuleCrmAuth, 
  name: 'find_project',
  displayName: 'Find Project',
  description: 'Find a project by its name or other criteria.',
  props: {
    project_id: capsuleCrmProps.project_id(false),
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description:
        'The text to search for in the project name. (Used if Project ID is not selected).',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { project_id, search_term } = propsValue;
    if (project_id) {
      const project = await capsuleCrmClient.getProject(
        auth,
        project_id as number
      );
      return project ? [project] : [];
    }
    if (search_term) {
      const projects = await capsuleCrmClient.findProject(auth, {
        searchTerm: search_term,
      });
      return projects;
    }
    throw new Error('One of Project ID or Search Term must be provided.');
  },
});
