import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeFields } from '../../common/fields';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiCreateDeal = createAction({
  auth: ninjapipeAuth,
  name: 'ai_create_deal',
  classification: 'WRITE',
  displayName: 'Create Deal',
  description: 'Creates a deal.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a NinjaPipe deal with a name and optional value, status (Open, In Progress, Won, Lost), owner_id, contact_id and company_id. Not idempotent: each call creates another deal.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.deal,
  props: {
    name: ninjapipeAiProps.text({ displayName: 'Name', description: 'Deal name.', required: true }),
    value: ninjapipeAiProps.number({ displayName: 'Value', description: 'Deal value as a plain number, e.g. 1500.' }),
    status: ninjapipeAiProps.choice({ displayName: 'Status', description: 'Deal status. Default Open.', values: ['Open', 'In Progress', 'Won', 'Lost'] }),
    owner_id: ninjapipeAiProps.optionalId({ displayName: 'Owner ID', description: 'Owner account_id from ai_list_workspace_members.' }),
    contact_id: ninjapipeAiProps.optionalId({ displayName: 'Contact ID', description: 'Contact UUID from ai_search_contacts.' }),
    company_id: ninjapipeAiProps.optionalId({ displayName: 'Company ID', description: 'Company UUID from ai_search_companies.' }),
    fields: ninjapipeAiProps.customFields({ update: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = ninjapipeFields.compact({
      name: p.name,
      value: ninjapipeFields.toNumber({ value: p.value, field: 'Value' }),
      status: p.status,
      owner_id: p.owner_id,
      contact_id: p.contact_id,
      company_id: p.company_id,
      fields: ninjapipeFields.readCustomFields(p.fields),
    });
    return ninjapipeClient.sendRecord({ auth: ninjapipeClient.readAuth(context.auth), method: HttpMethod.POST, path: '/deals', body, operation: 'create deal' });
  },
});
