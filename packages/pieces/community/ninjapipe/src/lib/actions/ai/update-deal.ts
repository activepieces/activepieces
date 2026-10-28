import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeFields } from '../../common/fields';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiUpdateDeal = createAction({
  auth: ninjapipeAuth,
  name: 'ai_update_deal',
  classification: 'WRITE',
  displayName: 'Update Deal',
  description: 'Updates a deal.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change an existing NinjaPipe deal by deal_id: name, value, status (e.g. mark Won or Lost), owner, contact or company. Only the fields you give change; clear_fields unlinks contact_id or company_id. Custom fields are merged. Repeating the same call gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.deal,
  props: {
    deal_id: ninjapipeAiProps.id({ displayName: 'Deal ID', description: 'Deal UUID from ai_search_deals.' }),
    name: ninjapipeAiProps.text({ displayName: 'Name', description: 'New deal name.' }),
    value: ninjapipeAiProps.number({ displayName: 'Value', description: 'New value as a plain number.' }),
    status: ninjapipeAiProps.choice({ displayName: 'Status', description: 'New status.', values: ['Open', 'In Progress', 'Won', 'Lost'] }),
    owner_id: ninjapipeAiProps.optionalId({ displayName: 'Owner ID', description: 'Owner account_id from ai_list_workspace_members.' }),
    contact_id: ninjapipeAiProps.optionalId({ displayName: 'Contact ID', description: 'Contact UUID from ai_search_contacts.' }),
    company_id: ninjapipeAiProps.optionalId({ displayName: 'Company ID', description: 'Company UUID from ai_search_companies.' }),
    fields: ninjapipeAiProps.customFields({ update: true }),
    clear_fields: ninjapipeAiProps.clearFields({ fields: ['contact_id', 'company_id'] }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const path = `/deals/${ninjapipeClient.pathId({ value: p.deal_id, field: 'Deal ID' })}`;
    const fields = await ninjapipeFields.mergeCustomFields({ auth, path, fields: p.fields, operation: 'read deal' });
    const changes = ninjapipeFields.compact({
      name: p.name,
      value: ninjapipeFields.toNumber({ value: p.value, field: 'Value' }),
      status: p.status,
      owner_id: p.owner_id,
      contact_id: p.contact_id,
      company_id: p.company_id,
      fields,
    });
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: changes, clear: p.clear_fields }), what: 'deal' });
    return ninjapipeClient.sendRecord({ auth, method: HttpMethod.PUT, path, body, operation: 'update deal' });
  },
});
