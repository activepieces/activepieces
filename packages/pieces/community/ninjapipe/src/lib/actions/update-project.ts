import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon, toDateOnly } from '../common';

export const updateProject = createAction({
  auth: ninjapipeAuth,
  name: 'update_project',
  displayName: 'Update Project',
  description: 'Updates a project by ID.',
  props: {
    projectId: ninjapipeCommon.projectDropdownRequired,
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: ninjapipeCommon.projectStatusDropdown,
    priority: ninjapipeCommon.priorityDropdown,
    dueDate: Property.DateTime({ displayName: 'Due Date', required: false }),
    team: Property.Array({ displayName: 'Team', required: false }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
    settingsJson: Property.Object({ displayName: 'Extra Settings', required: false }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, unknown> = {};
    if (p.name) body['name'] = p.name;
    if (p.description !== undefined) body['description'] = p.description;
    if (p.status) body['status'] = p.status;
    if (p.priority) body['priority'] = p.priority;
    {
      const v = toDateOnly(p.dueDate);
      if (v) body['due_date'] = v;
    }
    if (p.team && Array.isArray(p.team) && p.team.length > 0) body['team'] = p.team;
    if (p.tags && Array.isArray(p.tags) && p.tags.length > 0) body['tags'] = p.tags;
    if (p.settingsJson && typeof p.settingsJson === 'object' && Object.keys(p.settingsJson).length > 0) {
      body['settings_json'] = p.settingsJson;
    }
    const response = await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.PUT,
      path: `/projects/${encodeURIComponent(String(p.projectId))}`,
      body,
    });
    return flattenCustomFields(response.body);
  },
});
