import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const findMilestoneAction = createAction({
  auth: teamworkAuth,
  name: 'find_milestone',
  displayName: 'Find Milestone',
  description: 'Find a milestone by name or due date in a project.',
  props: {
    project_id: teamworkProps.project_id(true),
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'The name or part of the name of the milestone to search for.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { project_id, searchTerm } = propsValue;
    
    if (!searchTerm) {
      throw new Error('Search term is required.');
    }

    const foundMilestones = await teamworkClient.findMilestones(auth as TeamworkAuth, project_id as string, searchTerm as string);

    if (foundMilestones.length === 0) {
      return {
        message: `No milestones found in this project matching the search term: "${searchTerm}"`,
        milestones: [],
      };
    }
    
    return {
      message: `Found ${foundMilestones.length} milestones matching the search term.`,
      milestones: foundMilestones,
    };
  },
});