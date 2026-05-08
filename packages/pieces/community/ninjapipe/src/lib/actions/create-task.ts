import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon, toDateOnly } from '../common';

export const createTask = createAction({
  auth: ninjapipeAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a task or subtask in a project.',
  props: {
    projectId: ninjapipeCommon.projectDropdownRequired,
    title: Property.ShortText({ displayName: 'Title', description: 'Task title.', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: ninjapipeCommon.taskStatusDropdown,
    priority: ninjapipeCommon.priorityDropdown,
    assigneeId: Property.ShortText({
      displayName: 'Assignee ID',
      description: 'Account ID of the user to assign this task to.',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
    parentId: Property.ShortText({
      displayName: 'Parent Task ID',
      description: 'Set to make this a subtask of another task in the same project.',
      required: false,
    }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
    settingsJson: Property.Object({
      displayName: 'Extra Settings',
      description: 'Additional task settings as a JSON object.',
      required: false,
    }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, unknown> = { title: p.title };
    if (p.description) body['description'] = p.description;
    if (p.status) body['status'] = p.status;
    if (p.priority) body['priority'] = p.priority;
    if (p.assigneeId) body['assignee_id'] = p.assigneeId;
    {
      const v = toDateOnly(p.dueDate);
      if (v) body['due_date'] = v;
    }
    if (p.parentId) body['parent_id'] = p.parentId;
    if (p.tags && Array.isArray(p.tags) && p.tags.length > 0) body['tags'] = p.tags;
    if (p.settingsJson && typeof p.settingsJson === 'object' && Object.keys(p.settingsJson).length > 0) {
      body['settings_json'] = p.settingsJson;
    }
    const response = await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: `/projects/${encodeURIComponent(String(p.projectId))}/tasks`,
      body,
    });
    return flattenCustomFields(response.body);
  },
});
