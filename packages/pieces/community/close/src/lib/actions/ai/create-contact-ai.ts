import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const createContactAi = createAction({
  auth: closeAuth,
  name: 'create_contact_ai',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Add a contact person to a lead.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a Close contact (a person) on an existing lead given its lead id (lead_...), with optional title, email, phone and website. If no lead id is passed, Close creates a new lead named after the contact. Custom fields take cf_ ids from List Custom Fields. Calling it twice creates two contacts, so check with Search Contacts first.',
    idempotent: false,
  },
  outputSchema: closeOutputSchemas.contact,
  props: {
    leadId: Property.ShortText({ displayName: 'Lead ID', description: 'lead_... the contact belongs to. Leave empty to create a new lead.', required: false }),
    name: Property.ShortText({ displayName: 'Name', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    url: Property.ShortText({ displayName: 'Website', required: false }),
    customFields: Property.Json({ displayName: 'Custom Fields', description: 'Object of cf_... id to value.', required: false }),
  },
  async run({ auth, propsValue }) {
    const leadId = closeClient.optionalCloseId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' });
    const title = closeClient.optionalText(propsValue.title);
    const email = closeClient.optionalText(propsValue.email);
    const phone = closeClient.optionalText(propsValue.phone);
    const url = closeClient.optionalText(propsValue.url);
    const body = {
      name: closeClient.requiredText({ value: propsValue.name, label: 'Name' }),
      ...(leadId ? { lead_id: leadId } : {}),
      ...(title ? { title } : {}),
      ...(email ? { emails: [{ email, type: 'office' }] } : {}),
      ...(phone ? { phones: [{ phone, type: 'office' }] } : {}),
      ...(url ? { urls: [{ url, type: 'url' }] } : {}),
      ...closeClient.customFieldsBody({ value: propsValue.customFields }),
    };
    const created = await closeClient.request({ auth, method: HttpMethod.POST, path: '/contact/', body });
    return closeMappers.contact(created);
  },
});

export { createContactAi };
