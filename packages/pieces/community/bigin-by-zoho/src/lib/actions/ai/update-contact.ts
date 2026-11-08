import { createAction } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { biginOutputSchemas } from '../../common/output-schemas';

export const biginUpdateContactAi = createAction({
  auth: biginAuth,
  name: 'bigin_update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact (Agent)',
  description: 'Update an existing contact in Bigin.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiUpdateResult,
  aiMetadata: {
    description:
      'Updates an existing Bigin contact by id. Only the fields you provide are changed; omitted fields keep their values. Tags are added to the existing tags of the record (it reads the record first), never replacing them. Idempotent: repeating the same update leaves the contact in the same state. Returns the saved record.',
    idempotent: true,
  },
  props: {
    recordId: biginAiProps.id({ displayName: 'Contact ID', description: 'Contact id. Resolve it with Search Records (Agent) on Contacts.', required: true }),
    lastName: biginAiProps.text({ displayName: 'Last Name', description: 'Last name of the contact.', required: false }),
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
    const connection = getBiginConnection(context.auth);
    const id = propsValue.recordId.trim();
    const tags = await biginRecords.mergeTagsWithExisting({ connection, module: 'Contacts', id, tags: propsValue.tags });

    const record = biginRecords.mergeAdditionalFields({
      record: {
      Last_Name: propsValue.lastName ?? undefined,
      First_Name: propsValue.firstName ?? undefined,
      Email: propsValue.email ?? undefined,
      Mobile: propsValue.mobile ?? undefined,
      Title: propsValue.title ?? undefined,
      Account_Name: biginRecords.lookup(propsValue.companyId ?? undefined),
      Owner: biginRecords.lookup(propsValue.ownerId ?? undefined),
      Tag: tags,
      Description: propsValue.description ?? undefined,
      },
      additionalFields: propsValue.additionalFields,
    });
    if (Object.keys(record).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    return biginRecords.update({ connection, module: 'Contacts', id, record });
  },
});
