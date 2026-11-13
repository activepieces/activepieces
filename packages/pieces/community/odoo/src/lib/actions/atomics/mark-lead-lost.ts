import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooMarkLeadLost = createAction({
  auth: odooAuth,
  name: 'odoo_mark_lead_lost',
  classification: 'WRITE',
  displayName: 'Mark Lead Lost',
  description: 'Mark an Odoo CRM lead or opportunity as lost.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Marks one Odoo CRM lead or opportunity as lost (action_set_lost), which archives it, with an optional lost reason. Recover it later with odoo_mark_lead_won or odoo_call_method action_unarchive. Needs the CRM app. Idempotent: a second call leaves it lost.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.lead,
  props: {
    lead_id: atomicProps.idProp({ displayName: 'Lead ID', description: 'crm.lead ID from odoo_find_leads.' }),
    lost_reason_id: atomicProps.optionalIdProp({ displayName: 'Lost Reason ID', description: 'crm.lost.reason ID. Resolve with odoo_name_search on crm.lost.reason.' }),
  },
  async run(context) {
    const id = odooInput.toId({ value: context.propsValue.lead_id, label: 'Lead ID' });
    const reason = odooInput.optionalId({ value: context.propsValue.lost_reason_id, label: 'Lost Reason ID' });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    await client.callAllowNone({
      model: odooApps.lead.model,
      method: 'action_set_lost',
      args: [[id]],
      kwargs: odooInput.definedOnly({ lost_reason_id: reason }),
    });
    return odooRecords.readApp({ client, model: odooApps.lead.model, id, wanted: odooApps.lead.fields, manyToOne: odooApps.lead.manyToOne });
  },
});
