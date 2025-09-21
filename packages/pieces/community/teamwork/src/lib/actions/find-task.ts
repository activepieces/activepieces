import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const findTaskAction = createAction({
  auth: teamworkAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Search for tasks based on various criteria.',
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Search Term',
      description: 'Find tasks by keyword in the content or description.',
      required: false,
    }),
    filter: Property.StaticDropdown({
      displayName: 'Due Date Filter',
      description: 'Filter tasks by their due dates.',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Anytime', value: 'anytime' },
          { label: 'Overdue', value: 'overdue' },
          { label: 'Today', value: 'today' },
          { label: 'Tomorrow', value: 'tomorrow' },
          { label: 'This Week', value: 'thisweek' },
          { label: 'Within 7 Days', value: 'within7' },
          { label: 'Within 14 Days', value: 'within14' },
          { label: 'Within 30 Days', value: 'within30' },
          { label: 'No Due Date', value: 'nodate' },
          { label: 'Completed', value: 'completed' },
        ],
      },
    }),
    responsiblePartyIds: Property.MultiSelectDropdown({
      displayName: 'Responsible People',
      description: 'Filter tasks assigned to specific people.',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        const people = await teamworkClient.getPeople(auth as TeamworkAuth);
        return {
          disabled: false,
          options: people.map((person: any) => ({
            label: `${person['first-name']} ${person['last-name']}`,
            value: person.id,
          })),
        };
      },
    }),
    includeCompletedTasks: Property.Checkbox({
      displayName: 'Include Completed Tasks',
      description: 'Include completed tasks in the search results.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { searchTerm, filter, responsiblePartyIds, includeCompletedTasks } = propsValue;

    const queryParams: Record<string, any> = {};

    if (searchTerm) queryParams['searchTerm'] = searchTerm;
    if (filter) queryParams['filter'] = filter;
    if (responsiblePartyIds && responsiblePartyIds.length > 0) queryParams['responsible-party-ids'] = (responsiblePartyIds as string[]).join(',');
    if (includeCompletedTasks) queryParams['includeCompletedTasks'] = includeCompletedTasks;

    const foundTasks = await teamworkClient.findTasks(auth as TeamworkAuth, queryParams);

    return {
      message: `Found ${foundTasks.length} tasks matching your search criteria.`,
      tasks: foundTasks,
    };
  },
});