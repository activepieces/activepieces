import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon, toDateOnly } from '../common';

export const createProject = createAction({
  auth: ninjapipeAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Creates a new project.',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: ninjapipeCommon.projectStatusDropdown,
    priority: ninjapipeCommon.priorityDropdown,
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
    contactId: ninjapipeCommon.contactDropdown,
    team: Property.Array({
      displayName: 'Team',
      description: 'Optional list of team members (account IDs).',
      required: false,
    }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
    settingsJson: Property.Object({
      displayName: 'Extra Settings',
      description: 'Optional metadata (e.g. linked contact, custom fields).',
      required: false,
    }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, unknown> = { name: p.name };
    if (p.description) body['description'] = p.description;
    if (p.status) body['status'] = p.status;
    if (p.priority) body['priority'] = p.priority;
    {
      const v = toDateOnly(p.dueDate);
      if (v) body['due_date'] = v;
    }
    if (p.team && Array.isArray(p.team) && p.team.length > 0) body['team'] = p.team;
    if (p.tags && Array.isArray(p.tags) && p.tags.length > 0) body['tags'] = p.tags;
    const settings: Record<string, unknown> =
      p.settingsJson && typeof p.settingsJson === 'object'
        ? { ...(p.settingsJson as Record<string, unknown>) }
        : {};
    if (p.contactId) settings['contact_id'] = p.contactId;
    if (Object.keys(settings).length > 0) body['settings_json'] = settings;
    const response = await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: '/projects',
      body,
    });
    return flattenCustomFields(response.body);
  },
});
