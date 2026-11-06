import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const updateProject = createAction({
  auth: ninjapipeAuth,
  name: 'update_project',
  classification: 'WRITE',
  displayName: 'Update Project',
  description: 'Updates a project. Fields left blank keep their value; use Clear Fields to empty them.',
  audience: 'both',
  aiMetadata: {
    description: 'Update a NinjaPipe project by ID. Only filled fields change and Clear Fields empties fields. Re-running with the same input gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.project,
  props: {
    projectId: ninjapipeProps.projectRequired(),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    status: ninjapipeProps.staticDropdown({ displayName: 'Status', description: 'Status.', values: ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'] }),
    priority: ninjapipeProps.staticDropdown({ displayName: 'Priority', description: 'Priority.', values: ['High', 'Medium', 'Low'] }),
    dueDate: Property.DateTime({ displayName: 'Due Date', description: 'Date (YYYY-MM-DD).', required: false }),
    team: Property.Array({ displayName: 'Team Member IDs', required: false }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
    clearFields: ninjapipeProps.clearFields({ fields: { description: 'Description', due_date: 'Due Date' } }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const path = `/projects/${ninjapipeClient.pathId({ value: p.projectId, field: 'Project' })}`;
    const changes = ninjapipeFields.compact({
      name: p.name,
      description: p.description,
      status: p.status,
      priority: p.priority,
      due_date: ninjapipeFields.toDateOnly({ value: p.dueDate, field: 'Due Date' }),
      team: ninjapipeFields.toStringList(p.team),
      tags: ninjapipeFields.toStringList(p.tags),
    });
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: changes, clear: p.clearFields }), what: 'project' });
    return ninjapipeClient.sendRecord({ auth, method: HttpMethod.PUT, path, body, operation: 'update project' });
  },
});
