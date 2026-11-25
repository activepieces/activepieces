import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctBodies, sageIntacctProps } from '../common/props';

export const createContactAction = createAction({
  auth: sageIntacctAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a contact in the Sage Intacct company contact list.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a contact in the Sage Intacct company contact list. contact_name is the unique contact name (its ID). print_as is the name printed on documents; when empty it is built from first and last name, else the contact name. Optional: company_name, first_name, last_name, email, phone, mobile and mailing address. Returns the saved contact with its key. Not idempotent: repeating with the same contact_name fails as a duplicate.',
    idempotent: false,
  },
  props: {
    contact_name: Property.ShortText({ displayName: 'Contact Name', description: 'Unique name that identifies the contact.', required: true }),
    ...sageIntacctProps.contactInfoProps(),
    print_as: sageIntacctProps.text({
      displayName: 'Print As',
      description: 'Name printed on documents. Defaults to the first and last name, else the contact name.',
    }),
    mobile: Property.ShortText({ displayName: 'Mobile', required: false }),
  },
  outputSchema: sageIntacctSchemas.contact,
  async run(context) {
    const { contact_name, mobile, ...contact } = context.propsValue;
    const id = sageIntacctBodies.trimmed(contact_name);
    if (!id) {
      throw new Error('Contact Name is required.');
    }
    const fullName = [sageIntacctBodies.trimmed(contact.first_name), sageIntacctBodies.trimmed(contact.last_name)].filter(Boolean).join(' ');
    const body = sageIntacctBodies.compact({
      id,
      ...sageIntacctBodies.buildContactInfo({ ...contact, print_as: sageIntacctBodies.trimmed(contact.print_as) ?? (fullName || id) }),
      mobile: sageIntacctBodies.trimmed(mobile),
    });
    const record = await sageIntacctClient.createRecord({ auth: context.auth, object: sageIntacctRecords.CONTACT_OBJECT, body });
    return sageIntacctRecords.toContact(record);
  },
});
