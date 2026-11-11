import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../auth';
import { ccContacts } from '../common/client';
import { contactOutputSchema } from '../common/output-schemas';
import { ccInput, ccProps } from '../common/props';

export const updateContact = createAction({
  auth: constantContactAuth,
  name: 'update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description:
    'Changes the details of an existing contact. Only the fields you fill in are changed; everything else, including email permission and current list memberships, is kept. Empty fields cannot be used to clear a value.',
  audience: 'human',
  aiMetadata: {
    description: 'Updates the given fields of one existing Constant Contact contact, keeping all other fields, lists and email permission.',
    idempotent: true,
  },
  outputSchema: contactOutputSchema,
  props: {
    contact: ccProps.contactRef({
      displayName: 'Contact Email or ID',
      description: 'The email address of the contact, or its contact ID from an earlier step.',
    }),
    first_name: ccProps.text({ displayName: 'First Name', description: 'Max 50 characters.' }),
    last_name: ccProps.text({ displayName: 'Last Name', description: 'Max 50 characters.' }),
    job_title: ccProps.text({ displayName: 'Job Title', description: 'Max 50 characters.' }),
    company_name: ccProps.text({ displayName: 'Company Name', description: 'Max 50 characters.' }),
    phone_number: ccProps.text({ displayName: 'Phone Number', description: 'Replaces the phone number of the same type, or is added as a new one (max 3 per contact).' }),
    phone_kind: ccProps.phoneKind(),
    birthday_month: ccProps.birthdayMonth(),
    birthday_day: ccProps.birthdayDay(),
    anniversary: ccProps.anniversary(),
    address_kind: ccProps.addressKind(),
    street: ccProps.text({ displayName: 'Street', description: 'Updates the address of the selected type, or adds one.' }),
    city: ccProps.text({ displayName: 'City', description: 'City of the address.' }),
    state: ccProps.text({ displayName: 'State or Province', description: 'State or province of the address.' }),
    postal_code: ccProps.text({ displayName: 'Postal Code', description: 'ZIP or postal code of the address.' }),
    country: ccProps.text({ displayName: 'Country', description: 'Country of the address.' }),
    add_to_lists: ccProps.listsMulti({
      displayName: 'Add to Lists',
      description: 'Lists to add the contact to. The contact stays on its current lists.',
      required: false,
    }),
    custom_fields: ccProps.customFields(),
  },
  async run({ auth, propsValue }) {
    const changes = {
      ...ccInput.contactChanges({ ...propsValue }),
      custom_fields: ccInput.customFieldsFromDynamic(propsValue.custom_fields),
      add_list_ids: ccInput.idList({ value: propsValue.add_to_lists, label: 'Add to Lists', max: 50, required: false }),
    };
    if (!ccInput.hasChanges(changes)) {
      throw new Error('Fill in at least one field to change.');
    }
    const contactId = await ccContacts.resolveContactId({ accessToken: auth.access_token, value: propsValue.contact, label: 'Contact Email or ID' });
    return ccContacts.updateContact({ accessToken: auth.access_token, contactId, changes });
  },
});
