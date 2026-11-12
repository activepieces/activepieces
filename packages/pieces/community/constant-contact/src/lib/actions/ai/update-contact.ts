import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccContacts } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { contactOutputSchema } from '../../common/output-schemas';

export const updateContactAiAction = createAction({
  auth: constantContactAuth,
  name: 'update_contact_ai',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Updates the given fields of one contact and keeps everything else.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the given fields of an existing Constant Contact contact (names, job, company, phone by type, birthday, anniversary, address by type, custom fields, extra lists) and keeps all other fields, list memberships and email permission; it never re-subscribes anyone. Omitted fields are kept; values cannot be cleared. Refuses deleted contacts. Safe to repeat.',
    idempotent: true,
  },
  outputSchema: contactOutputSchema,
  props: {
    contact_id_or_email: aiProps.contactIdOrEmail(),
    first_name: aiProps.text({ displayName: 'First Name', description: 'Max 50 characters.' }),
    last_name: aiProps.text({ displayName: 'Last Name', description: 'Max 50 characters.' }),
    job_title: aiProps.text({ displayName: 'Job Title', description: 'Max 50 characters.' }),
    company_name: aiProps.text({ displayName: 'Company Name', description: 'Max 50 characters.' }),
    phone_number: aiProps.text({ displayName: 'Phone Number', description: 'Max 25 characters. Replaces the phone of the same Phone Type or adds one (max 3).' }),
    phone_kind: aiProps.text({ displayName: 'Phone Type', description: 'home, work, mobile or other (default other).' }),
    birthday_month: aiProps.text({ displayName: 'Birthday Month', description: '1-12, together with Birthday Day.' }),
    birthday_day: aiProps.text({ displayName: 'Birthday Day', description: '1-31, together with Birthday Month.' }),
    anniversary: aiProps.text({ displayName: 'Anniversary', description: 'Date such as 2020-06-15.' }),
    address_kind: aiProps.text({ displayName: 'Address Type', description: 'home, work or other (default home). Replaces the address of that type.' }),
    street: aiProps.text({ displayName: 'Street', description: 'Number and street.' }),
    city: aiProps.text({ displayName: 'City', description: 'City.' }),
    state: aiProps.text({ displayName: 'State', description: 'State or province.' }),
    postal_code: aiProps.text({ displayName: 'Postal Code', description: 'ZIP or postal code.' }),
    country: aiProps.text({ displayName: 'Country', description: 'Country.' }),
    add_list_ids: aiProps.text({ displayName: 'Add to List IDs', description: 'Comma-separated list IDs to add; current lists are kept.' }),
    custom_fields: aiProps.customFieldsJson(),
  },
  async run({ auth, propsValue }) {
    const changes = {
      ...ccInput.contactChanges({ ...propsValue }),
      custom_fields: ccInput.customFieldsFromJson({ value: propsValue.custom_fields, label: 'Custom Fields' }),
      add_list_ids: ccInput.idList({ value: propsValue.add_list_ids, label: 'Add to List IDs', max: 50, required: false }),
    };
    if (!ccInput.hasChanges(changes)) {
      throw new Error('Give at least one field to change.');
    }
    const contactId = await ccContacts.resolveContactId({ accessToken: auth.access_token, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' });
    return ccContacts.updateContact({ accessToken: auth.access_token, contactId, changes });
  },
});
