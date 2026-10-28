import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const createProject = createAction({
  auth: ninjapipeAuth,
  name: 'create_project',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Creates a project.',
  audience: 'both',
  aiMetadata: {
    description: 'Create a NinjaPipe project. Required: name. Not idempotent: each call creates another project.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.project,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: ninjapipeProps.staticDropdown({ displayName: 'Status', description: 'Status.', values: ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'] }),
    priority: ninjapipeProps.staticDropdown({ displayName: 'Priority', description: 'Priority.', values: ['High', 'Medium', 'Low'] }),
    dueDate: Property.DateTime({ displayName: 'Due Date', description: 'Date (YYYY-MM-DD).', required: false }),
    team: Property.Array({ displayName: 'Team Member IDs', required: false }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = ninjapipeFields.compact({
      name: p.name,
      description: p.description,
      status: p.status,
      priority: p.priority,
      due_date: ninjapipeFields.toDateOnly({ value: p.dueDate, field: 'Due Date' }),
      team: ninjapipeFields.toStringList(p.team),
      tags: ninjapipeFields.toStringList(p.tags),
    });
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: '/projects',
      body,
      operation: 'create project',
    });
  },
});
