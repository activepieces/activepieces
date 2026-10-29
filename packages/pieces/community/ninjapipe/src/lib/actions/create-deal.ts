import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const createDeal = createAction({
  auth: ninjapipeAuth,
  name: 'create_deal',
  classification: 'WRITE',
  displayName: 'Create Deal',
  description: 'Creates a deal.',
  audience: 'human',
  aiMetadata: {
    description: 'Create a NinjaPipe deal. Required: name. Not idempotent: each call creates another deal.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.deal,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    value: Property.Number({ displayName: 'Value', description: 'Deal value as a number.', required: false }),
    status: ninjapipeProps.staticDropdown({ displayName: 'Status', description: 'Status.', values: ['Open', 'In Progress', 'Won', 'Lost'] }),
    owner: ninjapipeProps.member({ displayName: 'Owner', description: 'Workspace member who owns the deal (owner_id).' }),
    contactId: ninjapipeProps.contactOptional(),
    companyId: ninjapipeProps.companyOptional(),
    customFields: ninjapipeProps.customFields({ update: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = ninjapipeFields.compact({
      name: p.name,
      value: ninjapipeFields.toNumber({ value: p.value, field: 'Value' }),
      status: p.status,
      owner_id: p.owner,
      contact_id: p.contactId,
      company_id: p.companyId,
      fields: ninjapipeFields.readCustomFields(p.customFields),
    });
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: '/deals',
      body,
      operation: 'create deal',
    });
  },
});
