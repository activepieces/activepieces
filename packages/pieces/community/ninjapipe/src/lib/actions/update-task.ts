import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const updateTask = createAction({
  auth: ninjapipeAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Updates a task by ID.',
  props: {
    taskId: Property.ShortText({ displayName: 'Task ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    priority: Property.ShortText({ displayName: 'Priority', required: false }),
    owner: Property.ShortText({ displayName: 'Owner', required: false }),
    dueDate: Property.ShortText({ displayName: 'Due Date', description: 'ISO date string or YYYY-MM-DD.', required: false }),
    projectId: ninjapipeCommon.projectDropdown,
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    customFields: Property.Object({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, any> = {};
    if (p.name) body.name = p.name;
    if (p.title) body.title = p.title;
    if (p.status) body.status = p.status;
    if (p.priority) body.priority = p.priority;
    if (p.owner) body.owner = p.owner;
    if (p.dueDate) body.due_date = p.dueDate;
    if (p.projectId) body.project_id = p.projectId;
    if (p.notes) body.notes = p.notes;
    if (p.customFields && typeof p.customFields === 'object') body.custom_fields = p.customFields;
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.PUT, path: `/tasks/${p.taskId}`, body });
    return flattenCustomFields(response.body);
  },
});
