import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../auth';
import { tarventCommon } from '../../common';
import { tarventClient } from '../../common/client';
import { tarventOutputSchemas } from '../../output-schemas';

const FIELDS: { key: string; label: string; max: number }[] = [
  { key: 'email', label: 'Email', max: 320 },
  { key: 'firstName', label: 'First name', max: 100 },
  { key: 'lastName', label: 'Last name', max: 100 },
  { key: 'streetAddress', label: 'Street address', max: 100 },
  { key: 'streetAddress2', label: 'Street address 2', max: 50 },
  { key: 'addressLocality', label: 'City', max: 100 },
  { key: 'addressRegion', label: 'State / Region', max: 100 },
  { key: 'postalCode', label: 'Postal code', max: 15 },
  { key: 'addressCountry', label: 'Country', max: 100 },
  { key: 'language', label: 'Language', max: 20 },
  { key: 'timeZone', label: 'Time zone', max: 100 },
];

export const updateContactAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_contact_ai',
  classification: 'WRITE',
  displayName: 'Update Contact (AI)',
  description: 'Updates fields of an existing contact by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes fields of an existing Tarvent contact given its audience ID and contact ID; only the fields you pass change, nothing is cleared. Can change the email address, names, address, language (culture code or Auto) and time zone (IANA name or Auto). Use Add or Remove Contact Tags and Add or Remove Contact From Group for tags and groups, and Create or Update Contact to add a contact by email. Fails if the contact does not exist. Idempotent: the same input sets the same values.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.contact,
  props: {
    audienceId: Property.ShortText({ displayName: 'Audience ID', description: 'The Tarvent audience ID.', required: true }),
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'The Tarvent contact ID (from Find Contact).', required: true }),
    email: Property.ShortText({ displayName: 'New email', required: false }),
    firstName: Property.ShortText({ displayName: 'First name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last name', required: false }),
    streetAddress: Property.ShortText({ displayName: 'Street address', required: false }),
    streetAddress2: Property.ShortText({ displayName: 'Street address 2', required: false }),
    addressLocality: Property.ShortText({ displayName: 'City', required: false }),
    addressRegion: Property.ShortText({ displayName: 'State / Region', required: false }),
    postalCode: Property.ShortText({ displayName: 'Postal code', required: false }),
    addressCountry: Property.ShortText({ displayName: 'Country', required: false }),
    language: Property.ShortText({ displayName: 'Language', required: false }),
    timeZone: Property.ShortText({ displayName: 'Time zone', required: false }),
  },
  async run(context) {
    const values: Record<string, unknown> = context.propsValue;
    const audienceId = tarventCommon.requireText({ value: context.propsValue.audienceId, label: 'Audience ID' });
    const id = tarventCommon.requireText({ value: context.propsValue.contactId, label: 'Contact ID' });
    const set = Object.fromEntries(
      FIELDS.flatMap((f) => {
        const value = tarventCommon.trimmed(values[f.key]);
        if (value === undefined) return [];
        tarventCommon.checkLength({ value, label: f.label, max: f.max });
        return [[f.key, value]];
      }),
    );
    if (Object.keys(set).length === 0) {
      throw new Error('Nothing to update. Pass at least one field.');
    }
    return tarventClient.updateContact({ auth: context.auth.props, input: { id, audienceId, ...set } });
  },
});
