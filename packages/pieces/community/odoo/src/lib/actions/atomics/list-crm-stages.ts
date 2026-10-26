import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { Domain, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooListCrmStages = createAction({
  auth: odooAuth,
  name: 'odoo_list_crm_stages',
  classification: 'SEARCH',
  displayName: 'List CRM Stages',
  description: 'List the pipeline stages of Odoo CRM.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Odoo CRM pipeline stages (crm.stage) in pipeline order, with whether each is the won stage and which sales teams use it; optionally only the stages available to one team. Use to get a stage ID for creating or moving leads. Needs the CRM app. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.stages,
  props: {
    team_id: atomicProps.optionalIdProp({ displayName: 'Sales Team ID', description: 'Only stages used by this team, plus shared ones.' }),
    limit: atomicProps.limitProp({ fallback: 100, max: 500 }),
    offset: atomicProps.offsetProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const map = await client.fieldsGet(odooApps.stage.model);
    const teamField = 'team_ids' in map ? 'team_ids' : 'team_id';
    const teamId = odooInput.optionalId({ value: p.team_id, label: 'Sales Team ID' });
    const domain: Domain = teamId ? ['|', [teamField, '=', false], [teamField, 'in', [teamId]]] : [];
    const page = await odooRecords.findApp({
      client,
      model: odooApps.stage.model,
      wanted: odooApps.stage.fields,
      domain,
      limit: odooInput.clampLimit({ value: p.limit, fallback: 100, max: 500 }),
      offset: odooInput.toOffset(p.offset),
      order: 'sequence asc, id asc',
    });
    const records = page.records.map((stage) => {
      const teamIds = Array.isArray(stage['team_ids']) ? stage['team_ids'] : typeof stage['team_id'] === 'number' ? [stage['team_id']] : [];
      return {
        id: stage['id'],
        name: stage['name'],
        sequence: stage['sequence'],
        is_won: stage['is_won'],
        fold: stage['fold'],
        team_ids: teamIds,
      };
    });
    return { ...page, records };
  },
});
