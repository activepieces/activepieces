import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../../common/client';
import { insightlyAuth, insightlyCommon } from '../../common/common';
import { insightlyMappers, outputSchemas } from '../../common/output-schemas';
import { aiProps } from '../../common/props';

function matches({ actual, expected }: { actual: string | null; expected: string | undefined }): boolean {
  return expected === undefined || (actual ?? '').toLowerCase() === expected.toLowerCase();
}

export const aiFindContacts = createAction({
  auth: insightlyAuth,
  name: 'ai_find_contacts',
  classification: 'SEARCH',
  displayName: 'Find Contacts',
  description: 'Find contacts by email or name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Insightly contacts by exact email, first name and/or last name (case-insensitive exact match). With no filter it lists contacts. Returns contact IDs for Get Contact, Update Contact, Add Note and Create Task. Read-only and safe to repeat.',
    idempotent: true,
  },
  outputSchema: outputSchemas['contactList'],
  props: {
    email: Property.ShortText({ displayName: 'Email', required: false }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    limit: aiProps.limit(),
  },
  async run({ auth, propsValue }) {
    const email = insightlyUtils.optionalText(propsValue.email);
    const firstName = insightlyUtils.optionalText(propsValue.firstName);
    const lastName = insightlyUtils.optionalText(propsValue.lastName);
    const limit = insightlyUtils.clampLimit(propsValue.limit);
    const filter = email
      ? { field: 'EMAIL_ADDRESS', value: email }
      : lastName
        ? { field: 'LAST_NAME', value: lastName }
        : firstName
          ? { field: 'FIRST_NAME', value: firstName }
          : undefined;
    const connection = await insightlyCommon.connect({ auth });
    const extraFilters = [email, firstName, lastName].filter((value) => value !== undefined).length > 1;
    const page = await insightlyCommon.findRecords({ connection, objectName: 'Contacts', filter, limit: extraFilters ? MAX_SCAN : limit });
    const contacts = page.records
      .map(insightlyMappers.contact)
      .filter((contact) => matches({ actual: contact.email, expected: email }) && matches({ actual: contact.firstName, expected: firstName }) && matches({ actual: contact.lastName, expected: lastName }));
    return { count: Math.min(contacts.length, limit), hasMore: contacts.length > limit || page.hasMore, contacts: contacts.slice(0, limit) };
  },
});

export const aiGetContact = createAction({
  auth: insightlyAuth,
  name: 'ai_get_contact',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Get one contact by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Insightly contact (name, email, phone, job title, organization ID, owner) by contact ID. Use Find Contacts first if you only know the email or name. Read-only.',
    idempotent: true,
  },
  outputSchema: outputSchemas['contact'],
  props: {
    contactId: Property.Number({ displayName: 'Contact ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const contactId = insightlyUtils.toId({ value: propsValue.contactId, label: 'Contact ID' });
    const connection = await insightlyCommon.connect({ auth });
    const record = insightlyUtils.sanitizeRecord(await insightlyCommon.call({ connection, method: HttpMethod.GET, path: `/Contacts/${contactId}` }));
    return insightlyMappers.contact(record);
  },
});

export const aiCreateContact = createAction({
  auth: insightlyAuth,
  name: 'ai_create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Create a contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Insightly contact. Not idempotent: each call creates another contact, so run Find Contacts by email first to avoid duplicates. Use Find Organizations to get an organization ID and Find User for an owner user ID.',
    idempotent: false,
  },
  outputSchema: outputSchemas['contact'],
  props: {
    firstName: Property.ShortText({ displayName: 'First Name', required: true }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    title: Property.ShortText({ displayName: 'Job Title', required: false }),
    organisationId: Property.Number({ displayName: 'Organization ID', required: false }),
    ownerUserId: Property.Number({ displayName: 'Owner User ID', required: false }),
  },
  async run({ auth, propsValue }) {
    const connection = await insightlyCommon.connect({ auth });
    const record = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({
        connection,
        method: HttpMethod.POST,
        path: '/Contacts',
        body: insightlyUtils.compact({
          FIRST_NAME: propsValue.firstName,
          LAST_NAME: propsValue.lastName,
          EMAIL_ADDRESS: propsValue.email,
          PHONE: propsValue.phone,
          TITLE: propsValue.title,
          ORGANISATION_ID: propsValue.organisationId,
          OWNER_USER_ID: propsValue.ownerUserId,
        }),
      }),
    );
    return insightlyMappers.contact(record);
  },
});

export const aiUpdateContact = createAction({
  auth: insightlyAuth,
  name: 'ai_update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Update fields on a contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the given fields of an existing Insightly contact; fields left empty are unchanged. Repeating the same call leaves the contact in the same state. Requires the contact ID from Find Contacts.',
    idempotent: true,
  },
  outputSchema: outputSchemas['updatedContact'],
  props: {
    contactId: Property.Number({ displayName: 'Contact ID', required: true }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    title: Property.ShortText({ displayName: 'Job Title', required: false }),
    organisationId: Property.Number({ displayName: 'Organization ID', required: false }),
    ownerUserId: Property.Number({ displayName: 'Owner User ID', required: false }),
  },
  async run({ auth, propsValue }) {
    const contactId = insightlyUtils.toId({ value: propsValue.contactId, label: 'Contact ID' });
    const connection = await insightlyCommon.connect({ auth });
    const updatedFields = await insightlyCommon.updateFields({
      connection,
      objectName: 'Contacts',
      recordId: contactId,
      fields: {
        FIRST_NAME: propsValue.firstName,
        LAST_NAME: propsValue.lastName,
        EMAIL_ADDRESS: propsValue.email,
        PHONE: propsValue.phone,
        TITLE: propsValue.title,
        ORGANISATION_ID: propsValue.organisationId,
        OWNER_USER_ID: propsValue.ownerUserId,
      },
    });
    return { id: contactId, updatedFields };
  },
});

const MAX_SCAN = 500;
