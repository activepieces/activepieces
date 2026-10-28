import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

const TEXT_FIELDS: { key: string; label: string; max: number }[] = [
  { key: 'firstName', label: 'First name', max: 100 },
  { key: 'lastName', label: 'Last name', max: 100 },
  { key: 'streetAddress', label: 'Street address', max: 100 },
  { key: 'streetAddress2', label: 'Street address 2', max: 50 },
  { key: 'addressLocality', label: 'City (Locality)', max: 100 },
  { key: 'addressRegion', label: 'State (Region)', max: 100 },
  { key: 'postalCode', label: 'Zip code (Postal code)', max: 15 },
  { key: 'addressCountry', label: 'Country', max: 100 },
  { key: 'language', label: 'Language', max: 20 },
  { key: 'timeZone', label: 'Time zone', max: 100 },
];

export const updateContact = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Updates fields of an existing contact by its ID. Fields left empty are not changed (Tarvent does not clear fields through the API).',
  audience: 'human',
  aiMetadata: {
    description:
      'Partially updates an existing Tarvent contact identified by audience ID and contact ID: only the fields you pass change; Tarvent cannot blank a field through this API, so empty values are ignored. Can change the contact\'s email address. Use this when you already have the contact ID; to create a contact or upsert by email use Create/Update Contact, and use the tag, group and status actions for those. Fails if the contact does not exist. Returns the updated contact. Idempotent: the same input sets the same values.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.contact,
  props: {
    audienceId: tarventCommon.audienceId(true, 'Audience the contact belongs to.'),
    contactId: tarventCommon.contactId,
    email: Property.ShortText({ displayName: 'New email', description: 'Change the contact\'s email address.', required: false }),
    firstName: Property.ShortText({ displayName: 'First name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last name', required: false }),
    streetAddress: Property.ShortText({ displayName: 'Street address', required: false }),
    streetAddress2: Property.ShortText({ displayName: 'Street address 2', required: false }),
    addressLocality: Property.ShortText({ displayName: 'City (Locality)', required: false }),
    addressRegion: Property.ShortText({ displayName: 'State (Region)', required: false }),
    postalCode: Property.ShortText({ displayName: 'Zip code (Postal code)', required: false }),
    addressCountry: Property.ShortText({ displayName: 'Country', required: false }),
    language: Property.ShortText({ displayName: 'Language', description: 'A culture code such as en or en-US, or Auto.', required: false }),
    timeZone: Property.ShortText({ displayName: 'Time zone', description: 'An IANA time zone such as America/Denver, or Auto.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const audienceId = tarventCommon.requireText({ value: p.audienceId, label: 'Audience' });
    const id = tarventCommon.requireText({ value: p.contactId, label: 'Contact ID' });
    const values: Record<string, unknown> = p;
    const set = Object.fromEntries(
      TEXT_FIELDS.flatMap((f) => {
        const value = tarventCommon.trimmed(values[f.key]);
        if (value === undefined) return [];
        tarventCommon.checkLength({ value, label: f.label, max: f.max });
        return [[f.key, value]];
      }),
    );
    const email = tarventCommon.trimmed(p.email);
    tarventCommon.checkLength({ value: email, label: 'New email', max: 320 });
    if (Object.keys(set).length === 0 && email === undefined) {
      throw new Error('Nothing to update. Set at least one field.');
    }
    return tarventClient.updateContact({
      auth: context.auth.props,
      input: { id, audienceId, ...set, ...(email ? { email } : {}) },
    });
  },
});
