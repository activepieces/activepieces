import { meistertaskAuth } from '../auth';
import { makeRequest } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const listTasks = createAction({
  auth: meistertaskAuth,
  name: 'list_tasks',
  displayName: 'List Tasks',
  description: 'Fetch a list of tasks from a specific section or project in MeisterTask to allow the agent to understand current task status, priorities, and workload distribution. Returns task details including name, status, assignee, due dates, and labels for comprehensive task overview.',
  props: {
    project: Property.Dropdown({
      auth: meistertaskAuth,
      displayName: 'Project',
      description: 'Select the MeisterTask project to list tasks from. The agent will retrieve all accessible tasks within this project scope.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your MeisterTask account first',
          };
        }
        try {
          const token = typeof auth === 'string' ? auth : (auth).access_token;
          const response = await makeRequest(HttpMethod.GET, '/projects', token);
          return {
            disabled: false,
            options: response.body.map((project: any) => ({
              label: project.name,
              value: project.id,
            })),
          };
        } catch (error) {
          return { disabled: true, options: [], placeholder: 'Error loading projects' };
        }
      },
    }),
    section: Property.Dropdown({
      auth: meistertaskAuth,
      displayName: 'Section',
      description: 'Optionally filter tasks by a specific section to narrow down the task list for focused analysis.',
      required: false,
      refreshers: ['project'],
      options: async ({ auth, project }) => {
        if (!auth || !project) {
          return { disabled: true, options: [], placeholder: 'Select a project first' };
        }
        try {
          const token = typeof auth === 'string' ? auth : (auth as any).access_token;
          const response = await makeRequest(HttpMethod.GET, `/projects/${project}/sections`, token);
          return {
            disabled: false,
            options: response.body.map((section: any) => ({
              label: section.name,
              value: section.id,
            })),
          };
        } catch (error) {
          return { disabled: true, options: [], placeholder: 'Error loading sections' };
        }
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status Filter',
      description: 'Filter tasks by completion status to help the agent focus on actionable items.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All Tasks', value: 'all' },
          { label: 'Open', value: 'open' },
          { label: 'Completed', value: 'completed' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit Results',
      description: 'Maximum number of tasks to return (1-100).',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { project, section, status, limit } = context.propsValue;
    let tasks: any[] = [];
    if (section) {
      const response = await makeRequest(HttpMethod.GET, `/sections/${section}/tasks`, token);
      tasks = response.body || [];
    } else if (project) {
      const response = await makeRequest(HttpMethod.GET, `/projects/${project}/tasks`, token);
      tasks = response.body || [];
    } else {
      const response = await makeRequest(HttpMethod.GET, '/tasks', token);
      tasks = response.body || [];
    }
    if (status && status !== 'all') {
      tasks = tasks.filter((task: any) => {
        if (status === 'completed') return task.status === 2;
        if (status === 'open') return task.status === 1;
        return true;
      });
    }
    if (limit && limit > 0) tasks = tasks.slice(0, limit);
    return {
      tasks: tasks.map((t: any) => ({ ...t, status_text: t.status === 1 ? 'open' : t.status === 2 ? 'completed' : 'unknown' })),
      total_count: tasks.length,
      filters_applied: { project: project || null, section: section || null, status: status || 'all' },
    };
  },
});
