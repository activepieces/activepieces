import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fetchTasks, fetchContacts, fetchProjects, fetchOpportunities, fetchUsers, WEALTHBOX_API_BASE, handleApiError } from '../common';

export const findTask = createAction({
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Finds existing tasks using comprehensive search filters. Search by assignment, resource, completion status, and date ranges.',
  props: {
    task_id: Property.Number({
      displayName: 'Task ID (Optional)',
      description: 'Search for a specific task by its unique ID. Leave empty to search using filters.',
      required: false
    }),

    resource_type: Property.StaticDropdown({
      displayName: 'Linked Resource Type',
      description: 'Filter tasks by the type of resource they are linked to',
      required: false,
      options: {
        options: [
          { label: 'Contact', value: 'Contact' },
          { label: 'Project', value: 'Project' },
          { label: 'Opportunity', value: 'Opportunity' }
        ]
      }
    }),

    resource_record: Property.DynamicProperties({
      displayName: 'Linked Resource',
      description: 'Select the specific resource to filter tasks by',
      required: false,
      refreshers: ['resource_type'],
      props: async ({ auth, resource_type }) => {
        if (!auth || !resource_type) {
          return {
            resource_id: Property.Number({
              displayName: 'Resource ID',
              description: 'Enter the resource ID manually',
              required: false
            })
          };
        }

        try {
          let records: any[] = [];
          let recordType = '';

          const resourceTypeValue = resource_type as unknown as string;

          switch (resourceTypeValue) {
            case 'Contact':
              records = await fetchContacts(auth as unknown as string, { active: true, order: 'recent' });
              recordType = 'Contact';
              break;
            case 'Project':
              records = await fetchProjects(auth as unknown as string);
              recordType = 'Project';
              break;
            case 'Opportunity':
              records = await fetchOpportunities(auth as unknown as string);
              recordType = 'Opportunity';
              break;
            default:
              return {
                resource_id: Property.Number({
                  displayName: 'Resource ID',
                  description: 'Enter the resource ID manually',
                  required: false
                })
              };
          }

          const recordOptions = records.map((record: any) => ({
            label: record.name || record.title || `${recordType} ${record.id}`,
            value: record.id
          }));

          return {
            resource_id: Property.StaticDropdown({
              displayName: `${recordType} Record`,
              description: `Select the ${recordType.toLowerCase()} to filter tasks by`,
              required: false,
              options: {
                options: recordOptions
              }
            })
          };
        } catch (error) {
          return {
            resource_id: Property.Number({
              displayName: 'Resource ID',
              description: 'Enter the resource ID manually (API unavailable)',
              required: false
            })
          };
        }
      }
    }),

    assigned_to: Property.Dropdown({
      displayName: 'Assigned To',
      description: 'Filter tasks by the user they are assigned to',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const users = await fetchUsers(auth as unknown as string);
          return {
            options: users.map((user: any) => ({
              label: `${user.name} (${user.email})`,
              value: user.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load users. Please check your authentication.'
          };
        }
      }
    }),

    assigned_to_team: Property.Number({
      displayName: 'Assigned to Team ID',
      description: 'Filter tasks by the team they are assigned to',
      required: false
    }),

    created_by: Property.Dropdown({
      displayName: 'Created By',
      description: 'Filter tasks by the user who created them',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };

        try {
          const users = await fetchUsers(auth as unknown as string);
          return {
            options: users.map((user: any) => ({
              label: `${user.name} (${user.email})`,
              value: user.id
            }))
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to load users. Please check your authentication.'
          };
        }
      }
    }),

    completed: Property.StaticDropdown({
      displayName: 'Completion Status',
      description: 'Filter by task completion status',
      required: false,
      options: {
        options: [
          { label: 'All Tasks', value: '' },
          { label: 'Completed Only', value: 'true' },
          { label: 'Incomplete Only', value: 'false' }
        ]
      }
    }),

    task_type: Property.StaticDropdown({
      displayName: 'Task Type',
      description: 'Filter by task type',
      required: false,
      options: {
        options: [
          { label: 'All Tasks', value: 'all' },
          { label: 'Parent Tasks Only', value: 'parents' },
          { label: 'Subtasks Only', value: 'subtasks' }
        ]
      }
    }),

    updated_since: Property.DateTime({
      displayName: 'Updated Since',
      description: 'Only return tasks updated on or after this date/time',
      required: false
    }),

    updated_before: Property.DateTime({
      displayName: 'Updated Before',
      description: 'Only return tasks updated on or before this date/time',
      required: false
    }),

    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of tasks to return (default: 50, max: 1000)',
      required: false,
      defaultValue: 50
    }),

    return_single_result: Property.Checkbox({
      displayName: 'Return Single Result Only',
      description: 'If checked, returns only the first matching task. If unchecked, returns all matching tasks.',
      required: false,
      defaultValue: false
    })
  },
  
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    

    
    const hasSearchCriteria =
      propsValue.task_id ||
      propsValue.resource_type ||
      (propsValue as any).resource_record?.resource_id ||
      propsValue.assigned_to ||
      propsValue.assigned_to_team ||
      propsValue.created_by ||
      propsValue.completed ||
      propsValue.task_type ||
      propsValue.updated_since ||
      propsValue.updated_before;

    if (!hasSearchCriteria) {
      throw new Error('At least one search criteria must be provided (Task ID, resource, assignment, status, or date filters)');
    }

    if (propsValue.task_id && !(propsValue.resource_type || (propsValue as any).resource_record?.resource_id || propsValue.assigned_to || propsValue.assigned_to_team || propsValue.created_by || propsValue.completed || propsValue.task_type || propsValue.updated_since || propsValue.updated_before)) {
      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${WEALTHBOX_API_BASE}/tasks/${propsValue.task_id}`,
          headers: {
            'ACCESS_TOKEN': auth as unknown as string,
            'Accept': 'application/json'
          }
        });

        if (response.status >= 400) {
          handleApiError('find task by ID', response.status, response.body);
        }

        return {
          found: true,
          task: response.body,
          tasks: [response.body],
          total_results: 1,
          search_criteria: { task_id: propsValue.task_id }
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          return {
            found: false,
            task: null,
            tasks: [],
            total_results: 0,
            message: `No task found with ID: ${propsValue.task_id}`,
            search_criteria: { task_id: propsValue.task_id }
          };
        }
        throw error;
      }
    }

    const searchParams = new URLSearchParams();

    if (propsValue.task_id) searchParams.append('id', propsValue.task_id.toString());

    if (propsValue.resource_type) searchParams.append('resource_type', propsValue.resource_type);
    const resourceRecord = (propsValue as any).resource_record;
    if (resourceRecord?.resource_id) {
      searchParams.append('resource_id', resourceRecord.resource_id.toString());
    }

    if (propsValue.assigned_to) searchParams.append('assigned_to', propsValue.assigned_to);
    if (propsValue.assigned_to_team) searchParams.append('assigned_to_team', propsValue.assigned_to_team.toString());
    if (propsValue.created_by) searchParams.append('created_by', propsValue.created_by);

    if (propsValue.completed && propsValue.completed !== '') {
      searchParams.append('completed', propsValue.completed);
    }
    if (propsValue.task_type && propsValue.task_type !== 'all') {
      searchParams.append('task_type', propsValue.task_type);
    }

    if (propsValue.updated_since) searchParams.append('updated_since', propsValue.updated_since);
    if (propsValue.updated_before) searchParams.append('updated_before', propsValue.updated_before);

    const limit = Math.min(propsValue.limit || 50, 1000);
    searchParams.append('limit', limit.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `${WEALTHBOX_API_BASE}/tasks?${queryString}` : `${WEALTHBOX_API_BASE}/tasks`;
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: url,
        headers: {
          'ACCESS_TOKEN': auth as unknown as string,
          'Accept': 'application/json'
        }
      });

      if (response.status >= 400) {
        handleApiError('find tasks', response.status, response.body);
      }

      const tasks = response.body.tasks || [];
      const totalResults = tasks.length;

      if (propsValue.return_single_result || totalResults === 1) {
        return {
          found: totalResults > 0,
          task: totalResults > 0 ? tasks[0] : null,
          tasks: tasks,
          total_results: totalResults,
          search_criteria: Object.fromEntries(searchParams),
          message: totalResults === 0 ? 'No tasks found matching the search criteria' : undefined
        };
      }

      return {
        found: totalResults > 0,
        tasks: tasks,
        total_results: totalResults,
        search_criteria: Object.fromEntries(searchParams),
        message: totalResults === 0 ? 'No tasks found matching the search criteria' : undefined
      };

    } catch (error) {
      throw new Error(`Failed to find tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});