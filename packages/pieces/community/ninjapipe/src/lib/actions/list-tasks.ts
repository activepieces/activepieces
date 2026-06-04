import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, extractItems, flattenArray, getAuth, ninjapipeCommon } from '../common';

export const listTasks = createAction({
  auth: ninjapipeAuth,
  name: 'list_tasks',
  displayName: 'List Tasks',
  description: 'Retrieves the tasks of a project as a flat list. Use parent_id on each item to build a tree.',
  props: {
    projectId: ninjapipeCommon.projectDropdownRequired,
    statusFilter: Property.StaticDropdown({
      displayName: 'Status Filter',
      required: false,
      options: {
        options: [
          { label: 'To Do', value: 'To Do' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Done', value: 'Done' },
          { label: 'Cancelled', value: 'Cancelled' },
        ],
      },
    }),
    priorityFilter: Property.StaticDropdown({
      displayName: 'Priority Filter',
      required: false,
      options: {
        options: [
          { label: 'High', value: 'High' },
          { label: 'Medium', value: 'Medium' },
          { label: 'Low', value: 'Low' },
        ],
      },
    }),
    parentId: Property.ShortText({
      displayName: 'Parent Task Filter',
      description: 'Pass a parent task ID to fetch its subtasks. Empty string to fetch only root tasks.',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      defaultValue: 'order_index',
      options: {
        options: [
          { label: 'Order Index', value: 'order_index' },
          { label: 'Created At', value: 'created_at' },
          { label: 'Updated At', value: 'updated_at' },
          { label: 'Title', value: 'title' },
          { label: 'Due Date', value: 'due_date' },
        ],
      },
    }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      required: false,
      defaultValue: 'asc',
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const qs: Record<string, string> = {};
    if (p.statusFilter) qs['status'] = p.statusFilter;
    if (p.priorityFilter) qs['priority'] = p.priorityFilter;
    if (p.parentId !== undefined && p.parentId !== null) qs['parent_id'] = p.parentId;
    if (p.sortBy) qs['sort_by'] = p.sortBy;
    if (p.sortOrder) qs['sort_order'] = p.sortOrder;
    const response = await ninjapipeApiCall<{ data?: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/projects/${encodeURIComponent(String(p.projectId))}/tasks`,
      queryParams: qs,
    });
    const items = extractItems(response.body);
    return flattenArray(items);
  },
});
