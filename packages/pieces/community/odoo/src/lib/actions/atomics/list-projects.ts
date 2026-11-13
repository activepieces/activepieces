import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooListProjects = createAction({
  auth: odooAuth,
  name: 'odoo_list_projects',
  classification: 'SEARCH',
  displayName: 'List Projects',
  description: 'List Odoo projects.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Odoo projects (project.project), optionally filtered by name, with customer, manager, dates and task count. Use to get the project ID for creating or finding tasks. Needs the Project app. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.projects,
  props: {
    query: atomicProps.textProp({ displayName: 'Name Contains', description: 'Part of the project name.' }),
    limit: atomicProps.limitProp({ fallback: 50, max: 500 }),
    offset: atomicProps.offsetProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const query = odooInput.optionalText(p.query);
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooRecords.findApp({
      client,
      model: odooApps.project.model,
      wanted: odooApps.project.fields,
      manyToOne: odooApps.project.manyToOne,
      domain: query ? [['name', 'ilike', query]] : [],
      limit: odooInput.clampLimit({ value: p.limit, fallback: 50, max: 500 }),
      offset: odooInput.toOffset(p.offset),
      order: 'name asc, id asc',
    });
  },
});
