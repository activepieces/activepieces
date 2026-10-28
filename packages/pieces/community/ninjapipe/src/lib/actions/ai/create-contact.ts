import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { NinjaPipeApiError, ninjapipeClient } from '../../common/client';
import { ninjapipeFields } from '../../common/fields';
import { ninjapipeRecords } from '../../common/records';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiCreateContact = createAction({
  auth: ninjapipeAuth,
  name: 'ai_create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Creates a contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new NinjaPipe contact. NinjaPipe allows one contact per email: if the email already exists the step fails and the error names the existing contact_id, so update that contact instead. Use upsert_contact when you want create-or-update in one call. Not idempotent.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.contact,
  props: {
    first_name: ninjapipeAiProps.text({ displayName: 'First Name', description: 'First name.' }),
    last_name: ninjapipeAiProps.text({ displayName: 'Last Name', description: 'Last name.' }),
    email: ninjapipeAiProps.text({ displayName: 'Email', description: 'Email address, unique per workspace.' }),
    phone: ninjapipeAiProps.text({ displayName: 'Phone', description: 'Phone number.' }),
    status: ninjapipeAiProps.text({ displayName: 'Status', description: 'Contact status, e.g. Active or Lead. Defaults to Active.' }),
    company_id: ninjapipeAiProps.optionalId({ displayName: 'Company ID', description: 'Company UUID from ai_search_companies.' }),
    owner_id: ninjapipeAiProps.optionalId({ displayName: 'Owner ID', description: 'Owner account_id from ai_list_workspace_members. Defaults to the API key owner.' }),
    assigned_to: ninjapipeAiProps.optionalId({ displayName: 'Assigned To', description: 'Assignee account_id from ai_list_workspace_members.' }),
    fields: ninjapipeAiProps.customFields({ update: false }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const body = ninjapipeFields.compact({
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      phone: p.phone,
      status: p.status,
      company_id: p.company_id,
      owner_id: p.owner_id,
      assigned_to: p.assigned_to,
      fields: ninjapipeFields.readCustomFields(p.fields),
    });
    if (Object.keys(body).length === 0) throw new Error('Give at least a name or an email for the contact.');
    try {
      return await ninjapipeClient.sendRecord({ auth, method: HttpMethod.POST, path: '/contacts', body, operation: 'create contact' });
    } catch (error) {
      if (!(error instanceof NinjaPipeApiError) || error.status !== 409 || typeof p.email !== 'string') throw error;
      const existing = await ninjapipeRecords.findContactByEmail({ auth, email: p.email });
      if (!existing) throw error;
      throw new NinjaPipeApiError({
        message: `A contact with email ${p.email} already exists (contact_id ${String(existing['id'])}). Update that contact instead of creating a new one.`,
        status: 409,
        code: error.code,
        responseBody: error.responseBody,
      });
    }
  },
});
