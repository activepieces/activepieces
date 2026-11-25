import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctBodies, sageIntacctProps } from '../common/props';

export const createVendorAction = createAction({
  auth: sageIntacctAuth,
  name: 'create_vendor',
  displayName: 'Create Vendor',
  description: 'Create a vendor in Sage Intacct.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a vendor record in Sage Intacct. name is required. vendor_id is the vendor ID; leave it empty only when the company auto-numbers vendors. status is "active" or "inactive". The optional contact fields fill the vendor default contact (print_as defaults to name). Returns the saved vendor with its key (record number) and id. Not idempotent: a repeat call with the same vendor_id fails as a duplicate, and without an ID it creates another vendor.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    vendor_id: Property.ShortText({
      displayName: 'Vendor ID',
      description: 'Unique vendor ID. Leave empty if the company auto-numbers vendors.',
      required: false,
    }),
    status: sageIntacctProps.statusProp(),
    ...sageIntacctProps.contactInfoProps(),
  },
  outputSchema: sageIntacctSchemas.vendor,
  async run(context) {
    const { vendor_id, name, status, ...contact } = context.propsValue;
    const body = sageIntacctBodies.buildPartyBody({
      id: vendor_id,
      name,
      status,
      contact: { ...contact, print_as: sageIntacctBodies.trimmed(contact.print_as) ?? name },
    });
    const record = await sageIntacctClient.createRecord({ auth: context.auth, object: sageIntacctRecords.VENDOR_OBJECT, body });
    return sageIntacctRecords.toParty(record);
  },
});
