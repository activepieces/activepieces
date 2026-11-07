import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeFields } from '../../common/fields';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiUpdateCompany = createAction({
  auth: ninjapipeAuth,
  name: 'ai_update_company',
  classification: 'WRITE',
  displayName: 'Update Company',
  description: 'Updates a company.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change fields of an existing NinjaPipe company by company_id. Only the fields you give change; list field names in clear_fields to empty them. Custom fields are merged into the existing ones. Repeating the same call gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.company,
  props: {
    company_id: ninjapipeAiProps.id({ displayName: 'Company ID', description: 'Company UUID from ai_search_companies.' }),
    name: ninjapipeAiProps.text({ displayName: 'Name', description: 'New name.' }),
    website: ninjapipeAiProps.text({ displayName: 'Website', description: 'New website URL.' }),
    email: ninjapipeAiProps.text({ displayName: 'Email', description: 'New email.' }),
    phone: ninjapipeAiProps.text({ displayName: 'Phone', description: 'New phone.' }),
    industry: ninjapipeAiProps.text({ displayName: 'Industry', description: 'New industry.' }),
    status: ninjapipeAiProps.text({ displayName: 'Status', description: 'New status.' }),
    owner_id: ninjapipeAiProps.optionalId({ displayName: 'Owner ID', description: 'Owner account_id from ai_list_workspace_members.' }),
    fields: ninjapipeAiProps.customFields({ update: true }),
    clear_fields: ninjapipeAiProps.clearFields({ fields: ['website', 'email', 'phone', 'industry'] }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const path = `/companies/${ninjapipeClient.pathId({ value: p.company_id, field: 'Company ID' })}`;
    const fields = await ninjapipeFields.mergeCustomFields({ auth, path, fields: p.fields, operation: 'read company' });
    const changes = ninjapipeFields.compact({
      name: p.name,
      website: p.website,
      email: p.email,
      phone: p.phone,
      industry: p.industry,
      status: p.status,
      owner_id: p.owner_id,
      fields,
    });
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: changes, clear: p.clear_fields }), what: 'company' });
    return ninjapipeClient.sendRecord({ auth, method: HttpMethod.PUT, path, body, operation: 'update company' });
  },
});
