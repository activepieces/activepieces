import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const addToList = createAction({
  auth: ninjapipeAuth,
  name: 'add_to_list',
  classification: 'WRITE',
  displayName: 'Add to List',
  description: 'Adds a contact or a company to a CRM list. Contact lists take contacts, company lists take companies.',
  audience: 'both',
  aiMetadata: {
    description: 'Add one member to a NinjaPipe CRM list by list ID: give exactly one of contactId or companyId, matching the list type. Safe to retry: adding a member already on the list returns already_in_list: true.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.listMember,
  props: {
    listId: Property.ShortText({ displayName: 'List ID', description: 'The list UUID (open the list in NinjaPipe and copy it from the URL).', required: true }),
    contactId: ninjapipeProps.contactOptional(),
    companyId: ninjapipeProps.companyOptional(),
  },
  async run(context) {
    const p = context.propsValue;
    const contactId = typeof p.contactId === 'string' ? p.contactId.trim() : '';
    const companyId = typeof p.companyId === 'string' ? p.companyId.trim() : '';
    if ((contactId === '') === (companyId === '')) {
      throw new Error('Choose exactly one of Contact or Company.');
    }
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: `/lists/${ninjapipeClient.pathId({ value: p.listId, field: 'List ID' })}/members`,
      body: contactId !== '' ? { contact_id: contactId } : { company_id: companyId },
      operation: 'add to list',
    });
  },
});
