import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const updateContact = createAction({
  auth: closeAuth,
  name: 'update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Change the name, title, email, phone or custom fields of a contact.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates an existing Close contact by contact id (cont_...). Only the fields you pass change; an empty Title clears it. Passing an email, phone or website replaces all of that kind on the contact with the single value given. Custom fields take cf_ ids from List Custom Fields; a null value clears that field. Returns the updated contact.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.contact,
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'cont_...', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    title: Property.ShortText({ displayName: 'Title', description: 'Pass an empty string to clear it.', required: false }),
    email: Property.ShortText({ displayName: 'Email', description: 'Replaces all emails on the contact.', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', description: 'Replaces all phones on the contact.', required: false }),
    url: Property.ShortText({ displayName: 'Website', description: 'Replaces all URLs on the contact.', required: false }),
    customFields: Property.Json({ displayName: 'Custom Fields', description: 'Object of cf_... id to value; null clears a field.', required: false }),
  },
  async run({ auth, propsValue }) {
    const contactId = closeClient.closeId({ value: propsValue.contactId, label: 'Contact ID', prefix: 'cont' });
    const body: Record<string, unknown> = { ...closeClient.customFieldsBody({ value: propsValue.customFields }) };
    const name = closeClient.optionalText(propsValue.name);
    const title = closeClient.clearableText(propsValue.title);
    const email = closeClient.optionalText(propsValue.email);
    const phone = closeClient.optionalText(propsValue.phone);
    const url = closeClient.optionalText(propsValue.url);
    if (name !== undefined) body['name'] = name;
    if (title !== undefined) body['title'] = title;
    if (email !== undefined) body['emails'] = [{ email, type: 'office' }];
    if (phone !== undefined) body['phones'] = [{ phone, type: 'office' }];
    if (url !== undefined) body['urls'] = [{ url, type: 'url' }];
    if (Object.keys(body).length === 0) throw new Error('Pass at least one field to update.');
    const updated = await closeClient.request({ auth, method: HttpMethod.PUT, path: `/contact/${closeClient.pathId(contactId)}/`, body });
    return closeMappers.contact(updated);
  },
});

export { updateContact };
