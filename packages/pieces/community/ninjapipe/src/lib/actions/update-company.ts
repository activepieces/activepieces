import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const updateCompany = createAction({
  auth: ninjapipeAuth,
  name: 'update_company',
  classification: 'WRITE',
  displayName: 'Update Company',
  description: 'Updates a company. Fields left blank keep their value; use Clear Fields to empty them.',
  audience: 'human',
  aiMetadata: {
    description: 'Update a NinjaPipe company by ID. Only filled fields change and Clear Fields empties fields; custom fields are merged with the existing ones. Re-running with the same input gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.company,
  props: {
    companyId: ninjapipeProps.companyRequired(),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    industry: Property.ShortText({ displayName: 'Industry', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    owner: ninjapipeProps.member({ displayName: 'Owner', description: 'Workspace member who owns the company (owner_id).' }),
    customFields: ninjapipeProps.customFields({ update: true }),
    clearFields: ninjapipeProps.clearFields({ fields: { email: 'Email', phone: 'Phone', website: 'Website', industry: 'Industry', status: 'Status' } }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const path = `/companies/${ninjapipeClient.pathId({ value: p.companyId, field: 'Company' })}`;
    const fields = await ninjapipeFields.mergeCustomFields({ auth, path, fields: p.customFields, operation: 'read company' });
    const changes = ninjapipeFields.compact({
      name: p.name,
      email: p.email,
      phone: p.phone,
      website: p.website,
      industry: p.industry,
      status: p.status,
      owner_id: p.owner,
      fields,
    });
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: changes, clear: p.clearFields }), what: 'company' });
    return ninjapipeClient.sendRecord({ auth, method: HttpMethod.PUT, path, body, operation: 'update company' });
  },
});
