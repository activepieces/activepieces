import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { odooDates, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooCreateTask = createAction({
  auth: odooAuth,
  name: 'odoo_create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Create a task in an Odoo project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one Odoo project task (project.task) in a project, with optional description, assignees, deadline, tags, priority, customer and parent task (sub-task). Needs the Project app. Not idempotent: each call creates a new task.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.task,
  props: {
    project_id: atomicProps.idProp({ displayName: 'Project ID', description: 'project.project ID from odoo_list_projects.' }),
    name: Property.ShortText({ displayName: 'Title', description: 'Task title.', required: true }),
    description: Property.LongText({ displayName: 'Description', description: 'Task description (plain text or simple HTML).', required: false }),
    user_ids: Property.Array({ displayName: 'Assignee User IDs', description: 'res.users IDs from odoo_list_users, for example [2].', required: false }),
    date_deadline: atomicProps.textProp({ displayName: 'Deadline', description: 'Date, for example 2026-10-15.' }),
    tag_ids: Property.Array({ displayName: 'Tag IDs', description: 'project.tags IDs.', required: false }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: '"0" normal (default) or "1" high.',
      required: false,
      options: { options: [{ label: 'Normal', value: '0' }, { label: 'High', value: '1' }] },
    }),
    partner_id: atomicProps.optionalIdProp({ displayName: 'Customer ID', description: 'res.partner ID.' }),
    parent_id: atomicProps.optionalIdProp({ displayName: 'Parent Task ID', description: 'Create as a sub-task of this task.' }),
  },
  async run(context) {
    const p = context.propsValue;
    const userIds = odooInput.toIdList({ value: p.user_ids, label: 'Assignee User IDs', allowEmpty: true });
    const tagIds = odooInput.toIdList({ value: p.tag_ids, label: 'Tag IDs', allowEmpty: true });
    const values = odooInput.definedOnly({
      project_id: odooInput.toId({ value: p.project_id, label: 'Project ID' }),
      name: p.name,
      description: odooInput.optionalText(p.description),
      user_ids: userIds.length > 0 ? [[6, 0, userIds]] : undefined,
      date_deadline: odooDates.inputToOdooDate({ value: p.date_deadline, label: 'Deadline' }),
      tag_ids: tagIds.length > 0 ? [[6, 0, tagIds]] : undefined,
      priority: odooInput.optionalText(p.priority),
      partner_id: odooInput.optionalId({ value: p.partner_id, label: 'Customer ID' }),
      parent_id: odooInput.optionalId({ value: p.parent_id, label: 'Parent Task ID' }),
    });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const id = await client.call<number>({ model: odooApps.task.model, method: 'create', args: [values] });
    return odooRecords.readApp({ client, model: odooApps.task.model, id, wanted: odooApps.task.fields, manyToOne: odooApps.task.manyToOne });
  },
});
