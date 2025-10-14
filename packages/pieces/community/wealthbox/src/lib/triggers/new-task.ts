import {
  createTrigger,
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod
} from '@activepieces/pieces-common';
import {
  pollingHelper,
  DedupeStrategy,
  Polling
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { fetchUsers, fetchContacts, fetchProjects, fetchOpportunities, WEALTHBOX_API_BASE, handleApiError } from '../common';

const polling: Polling<any, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS, auth }) => {
    if (!auth) {
      throw new Error('Authentication is required');
    }

    const searchParams = new URLSearchParams();

    searchParams.append('limit', '100');

    if (propsValue.assigned_to) searchParams.append('assigned_to', propsValue.assigned_to);
    if (propsValue.assigned_to_team) searchParams.append('assigned_to_team', propsValue.assigned_to_team.toString());
    if (propsValue.created_by) searchParams.append('created_by', propsValue.created_by);
    if (propsValue.task_type && propsValue.task_type !== 'all') searchParams.append('task_type', propsValue.task_type);
    if (propsValue.resource_type) searchParams.append('resource_type', propsValue.resource_type);

    const resourceRecord = (propsValue as any).resource_record;
    if (resourceRecord?.resource_id) {
      searchParams.append('resource_id', resourceRecord.resource_id.toString());
    }

    if (lastFetchEpochMS) {
      const lastFetchDate = dayjs(lastFetchEpochMS - 1000).toISOString();
      searchParams.append('updated_since', lastFetchDate);
    }

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
        handleApiError('poll new tasks', response.status, response.body);
      }

      const tasks = response.body.tasks || [];

      const newTasks = tasks.filter((task: any) => {
        if (!lastFetchEpochMS) return true;

        const taskCreatedAt = dayjs(task.created_at).valueOf();
        return taskCreatedAt > lastFetchEpochMS;
      });

      return newTasks.map((task: any) => ({
        epochMilliSeconds: dayjs(task.created_at).valueOf(),
        data: task
      }));
    } catch (error) {
      throw new Error(`Failed to poll new tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export const newTask = createTrigger({
  name: 'new_task',
  displayName: 'New Task',
  description: 'Fires when a new task is created',
  type: TriggerStrategy.POLLING,
  props: {
    assigned_to: Property.Dropdown({
      displayName: 'Assigned To',
      description: 'Only trigger for tasks assigned to this user (optional)',
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
      displayName: 'Assigned To Team ID',
      description: 'Only trigger for tasks assigned to this team (optional)',
      required: false
    }),

    created_by: Property.Dropdown({
      displayName: 'Created By',
      description: 'Only trigger for tasks created by this user (optional)',
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

    task_type: Property.StaticDropdown({
      displayName: 'Task Type',
      description: 'Type of tasks to monitor',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All Tasks', value: 'all' },
          { label: 'Parent Tasks Only', value: 'parents' },
          { label: 'Subtasks Only', value: 'subtasks' }
        ]
      }
    }),

    resource_type: Property.StaticDropdown({
      displayName: 'Linked Resource Type',
      description: 'Only trigger for tasks linked to this type of resource (optional)',
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
          console.warn('Could not fetch resource options for validation:', error);
          return {
            resource_id: Property.Number({
              displayName: 'Resource ID',
              description: 'Enter the resource ID manually (API unavailable)',
              required: false
            })
          };
        }
      }
    })
  },
  sampleData: {
    id: 1,
    creator: 1,
    created_at: '2015-05-24 10:00 AM -0400',
    updated_at: '2015-10-12 11:30 PM -0400',
    name: "Return Bill's call",
    due_date: '2015-05-24 11:00 AM -0400',
    complete: false,
    category: 1,
    linked_to: [
      {
        id: 1,
        type: 'Contact',
        name: 'Kevin Anderson'
      }
    ],
    priority: 'Medium',
    visible_to: 'Everyone',
    description: 'Follow up from message...',
    assigned_to: 1,
    assigned_to_team: 10
  },

  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth
    });
  },

  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth
    });
  },

  run: async (context) => {
    return await pollingHelper.poll(polling, context);
  },

  test: async (context) => {
    return await pollingHelper.test(polling, context);
  }
});
