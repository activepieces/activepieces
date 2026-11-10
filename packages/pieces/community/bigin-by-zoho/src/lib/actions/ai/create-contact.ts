import { createAction } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { biginOutputSchemas } from '../../common/output-schemas';

export const biginCreateContactAi = createAction({
  auth: biginAuth,
  name: 'bigin_create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact (Agent)',
  description: 'Create a new contact in Bigin.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiCreateResult,
  aiMetadata: {
    description:
      'Creates a new contact (person) in Bigin. Last Name is required. Not idempotent: each call creates a new contact even if one with the same email exists, so search first to avoid duplicates. Returns the new id and the saved record.',
    idempotent: false,
  },
  props: {
    lastName: biginAiProps.text({ displayName: 'Last Name', description: 'Last name of the contact.', required: true }),
    firstName: biginAiProps.text({ displayName: 'First Name', description: 'First name of the contact.', required: false }),
    email: biginAiProps.text({ displayName: 'Email', description: 'Email address.', required: false }),
    mobile: biginAiProps.text({ displayName: 'Mobile', description: 'Mobile phone number.', required: false }),
    title: biginAiProps.text({ displayName: 'Title', description: 'Job title.', required: false }),
    companyId: biginAiProps.text({ displayName: 'Company ID', description: 'Id of the company (Accounts record) the contact belongs to.', required: false }),
    ownerId: biginAiProps.ownerId(),
    tags: biginAiProps.tags(),
    description: biginAiProps.longText({ displayName: 'Description', description: 'Notes about the contact.', required: false }),
    additionalFields: biginAiProps.additionalFields(),
  },
  async run(context) {
    const { propsValue } = context;

    const record = biginRecords.mergeAdditionalFields({
      record: {
      Last_Name: propsValue.lastName ?? undefined,
      First_Name: propsValue.firstName ?? undefined,
      Email: propsValue.email ?? undefined,
      Mobile: propsValue.mobile ?? undefined,
      Title: propsValue.title ?? undefined,
      Account_Name: biginRecords.lookup(propsValue.companyId ?? undefined),
      Owner: biginRecords.lookup(propsValue.ownerId ?? undefined),
      Tag: biginRecords.toTagList(propsValue.tags),
      Description: propsValue.description ?? undefined,
      },
      additionalFields: propsValue.additionalFields,
    });
    return biginRecords.create({ connection: getBiginConnection(context.auth), module: 'Contacts', record });
  },
});
