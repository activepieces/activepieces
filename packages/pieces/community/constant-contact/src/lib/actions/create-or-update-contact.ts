import { Property, createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../auth';
import { ccClient } from '../common/client';
import { upsertContactOutputSchema } from '../common/output-schemas';
import { ccInput, ccProps } from '../common/props';
import { ccData } from '../common/types';

export const createOrUpdateContact = createAction({
  auth: constantContactAuth,
  name: 'create_or_update_contact',
  classification: 'WRITE',
  displayName: 'Create or Update Contact',
  description:
    'Adds a contact, or updates the contact with the same email, and adds it to the selected lists. This works like a sign-up form: it gives the contact email permission (explicit, or pending confirmation when Confirmed Opt-in is on) and re-subscribes a contact who had unsubscribed. It also restores a deleted contact with the same email, including its old lists. Only use it for people who agreed to receive your emails.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a Constant Contact contact, or updates the one with the same email, and adds it to 1-50 lists. It acts as a sign-up form: it sets email permission to explicit (or pending_confirmation) and RE-SUBSCRIBES a contact who unsubscribed (and restores a deleted contact with that email, with its old lists), so only use it when the person has consented to receive email. To edit an existing contact without touching consent, use Update Contact (AI). Repeating it with the same email updates the same contact.',
    idempotent: true,
  },
  outputSchema: upsertContactOutputSchema,
  props: {
    list: ccProps.listsMulti({
      displayName: 'List',
      description: 'The lists to add the contact to (1 to 50). Existing list memberships are kept.',
      required: true,
    }),
    email_address: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the contact. An existing contact with this email is updated.',
      required: true,
    }),
    first_name: ccProps.text({ displayName: 'First Name', description: 'The first name of the contact (max 50 characters).' }),
    last_name: ccProps.text({ displayName: 'Last Name', description: 'The last name of the contact (max 50 characters).' }),
    job_title: ccProps.text({ displayName: 'Job Title', description: 'The job title of the contact (max 50 characters).' }),
    company_name: ccProps.text({ displayName: 'Company Name', description: 'The company name of the contact (max 50 characters).' }),
    phoner_number: ccProps.text({ displayName: 'Phone Number', description: 'The phone number of the contact (max 25 characters).' }),
    birthday_month: ccProps.birthdayMonth(),
    birthday_day: ccProps.birthdayDay(),
    anniversary: ccProps.anniversary(),
    address_kind: ccProps.addressKind(),
    street: ccProps.text({ displayName: 'Street', description: 'Number and street of the address.' }),
    city: ccProps.text({ displayName: 'City', description: 'City of the address.' }),
    state: ccProps.text({ displayName: 'State or Province', description: 'State or province of the address.' }),
    postal_code: ccProps.text({ displayName: 'Postal Code', description: 'ZIP or postal code of the address.' }),
    country: ccProps.text({ displayName: 'Country', description: 'Country of the address.' }),
    custom_fields: ccProps.customFields(),
    custom_fields_json: ccProps.customFieldsJson(),
  },
  async run({ auth, propsValue }) {
    const listIds = ccInput.idList({ value: propsValue.list, label: 'List', max: 50, required: true });
    const email = ccInput.optionalText(propsValue.email_address);
    if (email === undefined) {
      throw new Error('Email is required.');
    }
    const changes = ccInput.contactChanges({ ...propsValue });
    const phoneNumber = ccInput.textWithin({ value: propsValue.phoner_number, label: 'Phone Number', max: 25 });
    const customFields = ccInput.mergeCustomFields({
      json: ccInput.customFieldsFromJson({ value: propsValue.custom_fields_json, label: 'Custom Fields (JSON by ID)' }),
      dynamic: ccInput.customFieldsFromDynamic(propsValue.custom_fields),
    });
    if (customFields.length > 50) {
      throw new Error('Constant Contact accepts at most 50 custom field values per contact.');
    }
    const response = await ccClient.request({
      accessToken: auth.access_token,
      method: 'POST',
      path: '/contacts/sign_up_form',
      operation: 'create or update contact',
      body: {
        email_address: email,
        first_name: changes.first_name,
        last_name: changes.last_name,
        job_title: changes.job_title,
        company_name: changes.company_name,
        phone_number: phoneNumber,
        birthday_month: changes.birthday_month,
        birthday_day: changes.birthday_day,
        anniversary: changes.anniversary,
        street_address: changes.street_address,
        custom_fields: customFields.length === 0 ? undefined : customFields,
        list_memberships: listIds,
      },
    });
    const contactId = ccData.textAt({ value: response.body, key: 'contact_id' });
    if (contactId === undefined) {
      throw new Error('Constant Contact accepted the contact but returned no contact ID.');
    }
    return { contact_id: contactId, action: ccData.textAt({ value: response.body, key: 'action' }) ?? (response.status === 201 ? 'created' : 'updated') };
  },
});
