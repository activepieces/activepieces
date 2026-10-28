import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeFields } from '../../common/fields';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiUpdateContact = createAction({
  auth: ninjapipeAuth,
  name: 'ai_update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Updates a contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change fields of an existing NinjaPipe contact by contact_id. Only the fields you give change; list field names in clear_fields to empty them (e.g. assigned_to to unassign). Custom fields are merged into the existing ones. Repeating the same call gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.contact,
  props: {
    contact_id: ninjapipeAiProps.id({ displayName: 'Contact ID', description: 'Contact UUID from ai_search_contacts.' }),
    first_name: ninjapipeAiProps.text({ displayName: 'First Name', description: 'New first name.' }),
    last_name: ninjapipeAiProps.text({ displayName: 'Last Name', description: 'New last name.' }),
    email: ninjapipeAiProps.text({ displayName: 'Email', description: 'New email, unique per workspace.' }),
    phone: ninjapipeAiProps.text({ displayName: 'Phone', description: 'New phone number.' }),
    status: ninjapipeAiProps.text({ displayName: 'Status', description: 'New status, e.g. Active or Lead.' }),
    company_id: ninjapipeAiProps.optionalId({ displayName: 'Company ID', description: 'Company UUID from ai_search_companies.' }),
    owner_id: ninjapipeAiProps.optionalId({ displayName: 'Owner ID', description: 'Owner account_id from ai_list_workspace_members.' }),
    assigned_to: ninjapipeAiProps.optionalId({ displayName: 'Assigned To', description: 'Assignee account_id from ai_list_workspace_members.' }),
    fields: ninjapipeAiProps.customFields({ update: true }),
    clear_fields: ninjapipeAiProps.clearFields({ fields: ['first_name', 'last_name', 'phone', 'company_id', 'assigned_to'] }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const path = `/contacts/${ninjapipeClient.pathId({ value: p.contact_id, field: 'Contact ID' })}`;
    const fields = await ninjapipeFields.mergeCustomFields({ auth, path, fields: p.fields, operation: 'read contact' });
    const changes = ninjapipeFields.compact({
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      phone: p.phone,
      status: p.status,
      company_id: p.company_id,
      owner_id: p.owner_id,
      assigned_to: p.assigned_to,
      fields,
    });
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: changes, clear: p.clear_fields }), what: 'contact' });
    return ninjapipeClient.sendRecord({ auth, method: HttpMethod.PUT, path, body, operation: 'update contact' });
  },
});
