import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeFields } from '../../common/fields';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiCreateCompany = createAction({
  auth: ninjapipeAuth,
  name: 'ai_create_company',
  classification: 'WRITE',
  displayName: 'Create Company',
  description: 'Creates a company.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a NinjaPipe company (organisation). Only name is required. NinjaPipe does not block duplicate names, so search with ai_search_companies first when the company may exist. Not idempotent.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.company,
  props: {
    name: ninjapipeAiProps.text({ displayName: 'Name', description: 'Company name.', required: true }),
    website: ninjapipeAiProps.text({ displayName: 'Website', description: 'Website URL.' }),
    email: ninjapipeAiProps.text({ displayName: 'Email', description: 'Company email.' }),
    phone: ninjapipeAiProps.text({ displayName: 'Phone', description: 'Company phone.' }),
    industry: ninjapipeAiProps.text({ displayName: 'Industry', description: 'Industry.' }),
    status: ninjapipeAiProps.text({ displayName: 'Status', description: 'Company status.' }),
    owner_id: ninjapipeAiProps.optionalId({ displayName: 'Owner ID', description: 'Owner account_id from ai_list_workspace_members.' }),
    fields: ninjapipeAiProps.customFields({ update: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = ninjapipeFields.compact({
      name: p.name,
      website: p.website,
      email: p.email,
      phone: p.phone,
      industry: p.industry,
      status: p.status,
      owner_id: p.owner_id,
      fields: ninjapipeFields.readCustomFields(p.fields),
    });
    return ninjapipeClient.sendRecord({ auth: ninjapipeClient.readAuth(context.auth), method: HttpMethod.POST, path: '/companies', body, operation: 'create company' });
  },
});
