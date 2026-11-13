import {
  createAction,
  isNil,
  Property,
} from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoTask } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const findTask = createAction({
  auth: togglTrackAuth,
  name: 'find_task',
  classification: 'SEARCH',
  displayName: 'Find Task',
  description: 'Find a task by name and status.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists tasks in a workspace, optionally filtered by name, project, status, and date range. Returns { total_count, page, per_page, data }. Read-only.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    search: Property.ShortText({
      displayName: 'Task Name',
      description: 'Search by task name.',
      required: false,
    }),
    project_id: Property.Number({
      displayName: 'Project ID',
      description: 'Filter by project ID.',
      required: false,
    }),
    active: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by active state.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
          { label: 'Both', value: 'both' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Items Per Page',
      description: 'Number of items per page (default 50).',
      required: false,
    }),
    sort_field: Property.StaticDropdown({
      displayName: 'Sort Field',
      description: 'Field used for sorting.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Name', value: 'name' },
          { label: 'Created At', value: 'created_at' },
        ],
      },
    }),
    sort_order: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Sort order.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Ascending', value: 'ASC' },
          { label: 'Descending', value: 'DESC' },
        ],
      },
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Smallest boundary date (YYYY-MM-DD).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Biggest boundary date (YYYY-MM-DD).',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.taskList,
  async run(context) {
    const {
      search,
      project_id,
      active,
      page,
      per_page,
      sort_field,
      sort_order,
      start_date,
      end_date,
    } = context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const projectId = togglApi.optionalId({
      value: project_id,
      label: 'Project ID',
    });

    if (togglApi.isTwo(auth)) {
      const queryParams: QueryParams = {};
      if (search) queryParams['name'] = search;
      if (!isNil(projectId)) queryParams['project_id'] = String(projectId);
      if (active === 'true') queryParams['archived'] = 'false';
      if (active === 'false') queryParams['archived'] = 'true';
      if (sort_field) {
        queryParams['order_by'] = `${sort_order === 'DESC' ? '-' : ''}${sort_field}`;
      }
      if (start_date) queryParams['start_date'] = start_date;
      if (end_date) queryParams['end_date'] = end_date;
      const tasks = await togglApi.listTwoPageOrAll<TwoTask>({
        auth,
        path: togglApi.twoWorkspacePath({ auth, workspaceId, path: '/tasks' }),
        queryParams,
        page: page ?? undefined,
        perPage: per_page ?? undefined,
      });
      return {
        total_count: tasks.length,
        page: page ?? 1,
        per_page: isNil(page) ? tasks.length : Math.min(per_page ?? 100, 100),
        sort_field: sort_field ?? null,
        sort_order: sort_order ?? null,
        data: tasks.map(togglModels.task),
      };
    }

    const queryParams: QueryParams = {};
    if (search) queryParams['search'] = search;
    if (!isNil(projectId)) queryParams['pid'] = String(projectId);
    if (active) queryParams['active'] = active;
    if (page) queryParams['page'] = page.toString();
    if (per_page) queryParams['per_page'] = per_page.toString();
    if (sort_field) queryParams['sort_field'] = sort_field;
    if (sort_order) queryParams['sort_order'] = sort_order;
    if (start_date) queryParams['start_date'] = start_date;
    if (end_date) queryParams['end_date'] = end_date;

    const response = await togglApi.request<{
      data: unknown[] | null;
      [key: string]: unknown;
    }>({
      auth,
      method: togglApi.HttpMethod.GET,
      path: `/workspaces/${workspaceId}/tasks`,
      queryParams,
    });
    return { ...response, data: response?.data ?? [] };
  },
});
