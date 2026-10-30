import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../auth';
import { tarventCommon } from '../../common';
import { tarventClient } from '../../common/client';
import { tarventOutputSchemas } from '../../output-schemas';

const TEXT_FIELDS: { key: string; label: string; max: number }[] = [
  { key: 'firstName', label: 'First name', max: 100 },
  { key: 'lastName', label: 'Last name', max: 100 },
  { key: 'streetAddress', label: 'Street address', max: 100 },
  { key: 'streetAddress2', label: 'Street address 2', max: 50 },
  { key: 'addressLocality', label: 'City', max: 100 },
  { key: 'addressRegion', label: 'State / Region', max: 100 },
  { key: 'postalCode', label: 'Postal code', max: 15 },
  { key: 'addressCountry', label: 'Country', max: 100 },
];

export const upsertContactAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_upsert_contact_ai',
  classification: 'WRITE',
  displayName: 'Create or Update Contact (AI)',
  description: 'Creates a contact by email, or updates the existing one.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Tarvent contact in an audience by email, or updates the contact that already has that email (set ifExists=FAIL to fail instead). Optional name and address fields are set, and comma-separated group IDs and tag names are added; existing groups and tags are never removed. customFields maps data field IDs to values (GDPR fields take 1 or 0). Empty fields are not sent. Returns the contact with its ID. To change a known contact by ID, for example its email, use Update Contact. Repeating the same call leaves the same contact, but groups and tags only ever grow.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.contact,
  props: {
    audienceId: Property.ShortText({ displayName: 'Audience ID', description: 'The Tarvent audience ID (from Find Audience).', required: true }),
    email: Property.ShortText({ displayName: 'Email', description: 'The contact email.', required: true }),
    ifExists: Property.StaticDropdown({
      displayName: 'If the email exists',
      description: 'What to do when a contact with this email already exists (default: update it).',
      required: false,
      options: {
        options: [
          { label: 'Update the contact', value: 'UPDATE' },
          { label: 'Fail', value: 'FAIL' },
        ],
      },
    }),
    firstName: Property.ShortText({ displayName: 'First name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last name', required: false }),
    streetAddress: Property.ShortText({ displayName: 'Street address', required: false }),
    streetAddress2: Property.ShortText({ displayName: 'Street address 2', required: false }),
    addressLocality: Property.ShortText({ displayName: 'City', required: false }),
    addressRegion: Property.ShortText({ displayName: 'State / Region', required: false }),
    postalCode: Property.ShortText({ displayName: 'Postal code', required: false }),
    addressCountry: Property.ShortText({ displayName: 'Country', required: false }),
    groupIds: Property.ShortText({ displayName: 'Group IDs', description: 'Audience group IDs to add the contact to. Separate multiple IDs with a comma.', required: false }),
    tags: Property.ShortText({ displayName: 'Tags', description: 'Tag names to add. Separate multiple tags with a comma.', required: false }),
    customFields: Property.Object({ displayName: 'Custom fields', description: 'Data field ID to value.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const values: Record<string, unknown> = p;
    const audienceId = tarventCommon.requireText({ value: p.audienceId, label: 'Audience ID' });
    const email = tarventCommon.requireText({ value: p.email, label: 'Email' });
    tarventCommon.checkLength({ value: email, label: 'Email', max: 320 });
    const text = Object.fromEntries(
      TEXT_FIELDS.flatMap((f) => {
        const value = tarventCommon.trimmed(values[f.key]);
        if (value === undefined) return [];
        tarventCommon.checkLength({ value, label: f.label, max: f.max });
        return [[f.key, value]];
      }),
    );
    const groupIds = stringList(p.groupIds);
    const tags = stringList(p.tags);
    const profile = tarventCommon.profileFromDataFields(p.customFields);
    return tarventClient.createContact({
      auth: context.auth.props,
      input: {
        ...text,
        email,
        audienceId,
        updateExisting: p.ifExists !== 'FAIL',
        audienceGroupManagementType: 'ADD_NEW_GROUPS_ONLY',
        tagManagementType: 'ADD_NEW_TAGS_ONLY',
        ...(profile.length > 0 ? { profile } : {}),
        ...(tags.length > 0 ? { tags } : {}),
        ...(groupIds.length > 0 ? { groupIds } : {}),
        sendFormat: 'MULTIPART',
      },
    });
  },
});

function stringList(value: unknown): string[] {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return items.map((v) => tarventCommon.trimmed(v)).filter((v): v is string => v !== undefined);
}
