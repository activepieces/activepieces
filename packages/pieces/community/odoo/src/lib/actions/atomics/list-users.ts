import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { Condition, odooDomain, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooListUsers = createAction({
  auth: odooAuth,
  name: 'odoo_list_users',
  classification: 'SEARCH',
  displayName: 'List Users',
  description: 'List internal Odoo users (salespeople, assignees).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists internal Odoo users (res.users, portal users excluded), optionally filtered by name, login or email. Use to get the user ID for salesperson, project manager or task assignee fields. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.users,
  props: {
    query: atomicProps.textProp({ displayName: 'Search Text', description: 'Matches name, login or email (contains).' }),
    limit: atomicProps.limitProp({ fallback: 50, max: 500 }),
    offset: atomicProps.offsetProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const query = odooInput.optionalText(p.query);
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const search = query ? odooDomain.orConditions(['name', 'login', 'email'].map((f): Condition => [f, 'ilike', query])) : [];
    return odooRecords.findApp({
      client,
      model: odooApps.user.model,
      wanted: odooApps.user.fields,
      manyToOne: odooApps.user.manyToOne,
      domain: odooDomain.andDomains([[['share', '=', false]], search]),
      limit: odooInput.clampLimit({ value: p.limit, fallback: 50, max: 500 }),
      offset: odooInput.toOffset(p.offset),
      order: 'name asc, id asc',
    });
  },
});
