import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooMarkLeadWon = createAction({
  auth: odooAuth,
  name: 'odoo_mark_lead_won',
  classification: 'WRITE',
  displayName: 'Mark Lead Won',
  description: 'Mark an Odoo CRM opportunity as won.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Marks one Odoo CRM lead or opportunity as won (action_set_won): moves it to the won stage and sets probability to 100, restoring it first if it was lost. Needs the CRM app. Idempotent: a second call leaves it won.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.lead,
  props: {
    lead_id: atomicProps.idProp({ displayName: 'Lead ID', description: 'crm.lead ID from odoo_find_leads.' }),
  },
  async run(context) {
    const id = odooInput.toId({ value: context.propsValue.lead_id, label: 'Lead ID' });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    await client.callAllowNone({ model: odooApps.lead.model, method: 'action_set_won', args: [[id]] });
    return odooRecords.readApp({ client, model: odooApps.lead.model, id, wanted: odooApps.lead.fields, manyToOne: odooApps.lead.manyToOne });
  },
});
