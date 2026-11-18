import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const createCompany = createAction({
  auth: ninjapipeAuth,
  name: 'create_company',
  classification: 'WRITE',
  displayName: 'Create Company',
  description: 'Creates a company.',
  audience: 'human',
  aiMetadata: {
    description: 'Create a NinjaPipe company. Required: name. Not idempotent: each call creates another company.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.company,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    industry: Property.ShortText({ displayName: 'Industry', required: false }),
    status: Property.ShortText({ displayName: 'Status', required: false }),
    owner: ninjapipeProps.member({ displayName: 'Owner', description: 'Workspace member who owns the company (owner_id).' }),
    customFields: ninjapipeProps.customFields({ update: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = ninjapipeFields.compact({
      name: p.name,
      email: p.email,
      phone: p.phone,
      website: p.website,
      industry: p.industry,
      status: p.status,
      owner_id: p.owner,
      fields: ninjapipeFields.readCustomFields(p.customFields),
    });
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: '/companies',
      body,
      operation: 'create company',
    });
  },
});
