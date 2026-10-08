import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { Condition, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooFindTasks = createAction({
  auth: odooAuth,
  name: 'odoo_find_tasks',
  classification: 'SEARCH',
  displayName: 'Find Tasks',
  description: 'Search Odoo project tasks.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Odoo project tasks (project.task) by project, assignee, stage, customer and title text, newest first with offset paging. Needs the Project app. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.tasks,
  props: {
    project_id: atomicProps.optionalIdProp({ displayName: 'Project ID', description: 'project.project ID.' }),
    user_id: atomicProps.optionalIdProp({ displayName: 'Assignee User ID', description: 'Tasks assigned to this res.users ID.' }),
    stage_id: atomicProps.optionalIdProp({ displayName: 'Stage ID', description: 'project.task.type ID.' }),
    partner_id: atomicProps.optionalIdProp({ displayName: 'Customer ID', description: 'res.partner ID.' }),
    query: atomicProps.textProp({ displayName: 'Title Contains', description: 'Part of the task title.' }),
    limit: atomicProps.limitProp({ fallback: 50, max: 500 }),
    offset: atomicProps.offsetProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const conditions: Condition[] = [];
    const projectId = odooInput.optionalId({ value: p.project_id, label: 'Project ID' });
    if (projectId) conditions.push(['project_id', '=', projectId]);
    const userId = odooInput.optionalId({ value: p.user_id, label: 'Assignee User ID' });
    if (userId) conditions.push(['user_ids', 'in', [userId]]);
    const stageId = odooInput.optionalId({ value: p.stage_id, label: 'Stage ID' });
    if (stageId) conditions.push(['stage_id', '=', stageId]);
    const partnerId = odooInput.optionalId({ value: p.partner_id, label: 'Customer ID' });
    if (partnerId) conditions.push(['partner_id', '=', partnerId]);
    const query = odooInput.optionalText(p.query);
    if (query) conditions.push(['name', 'ilike', query]);
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooRecords.findApp({
      client,
      model: odooApps.task.model,
      wanted: odooApps.task.fields,
      manyToOne: odooApps.task.manyToOne,
      domain: conditions,
      limit: odooInput.clampLimit({ value: p.limit, fallback: 50, max: 500 }),
      offset: odooInput.toOffset(p.offset),
      order: 'create_date desc, id desc',
    });
  },
});
