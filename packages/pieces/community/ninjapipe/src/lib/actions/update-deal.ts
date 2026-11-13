import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const updateDeal = createAction({
  auth: ninjapipeAuth,
  name: 'update_deal',
  classification: 'WRITE',
  displayName: 'Update Deal',
  description: 'Updates a deal. Fields left blank keep their value; use Clear Fields to empty them.',
  audience: 'human',
  aiMetadata: {
    description: 'Update a NinjaPipe deal by ID. Only filled fields change and Clear Fields empties fields; custom fields are merged with the existing ones. Re-running with the same input gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.deal,
  props: {
    dealId: ninjapipeProps.dealRequired(),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    value: Property.Number({ displayName: 'Value', description: 'Deal value as a number.', required: false }),
    status: ninjapipeProps.staticDropdown({ displayName: 'Status', description: 'Status.', values: ['Open', 'In Progress', 'Won', 'Lost'] }),
    owner: ninjapipeProps.member({ displayName: 'Owner', description: 'Workspace member who owns the deal (owner_id).' }),
    contactId: ninjapipeProps.contactOptional(),
    companyId: ninjapipeProps.companyOptional(),
    customFields: ninjapipeProps.customFields({ update: true }),
    clearFields: ninjapipeProps.clearFields({ fields: { contact_id: 'Contact', company_id: 'Company' } }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const path = `/deals/${ninjapipeClient.pathId({ value: p.dealId, field: 'Deal' })}`;
    const fields = await ninjapipeFields.mergeCustomFields({ auth, path, fields: p.customFields, operation: 'read deal' });
    const changes = ninjapipeFields.compact({
      name: p.name,
      value: ninjapipeFields.toNumber({ value: p.value, field: 'Value' }),
      status: p.status,
      owner_id: p.owner,
      contact_id: p.contactId,
      company_id: p.companyId,
      fields,
    });
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: changes, clear: p.clearFields }), what: 'deal' });
    return ninjapipeClient.sendRecord({ auth, method: HttpMethod.PUT, path, body, operation: 'update deal' });
  },
});
