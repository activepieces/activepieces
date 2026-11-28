import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctBodies, sageIntacctProps } from '../common/props';

export const createCustomerAction = createAction({
  auth: sageIntacctAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Create a customer in Sage Intacct.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a customer record in Sage Intacct. name is required. customer_id is the customer ID; leave it empty only when the company auto-numbers customers. status is "active" or "inactive". The optional contact fields fill the customer default contact (print_as defaults to name). Returns the saved customer with its key (record number) and id. Not idempotent: a repeat call with the same customer_id fails as a duplicate, and without an ID it creates another customer.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Unique customer ID. Leave empty if the company auto-numbers customers.',
      required: false,
    }),
    status: sageIntacctProps.statusProp(),
    ...sageIntacctProps.contactInfoProps(),
  },
  outputSchema: sageIntacctSchemas.customer,
  async run(context) {
    const { customer_id, name, status, ...contact } = context.propsValue;
    const body = sageIntacctBodies.buildPartyBody({
      id: customer_id,
      name,
      status,
      contact: { ...contact, print_as: sageIntacctBodies.trimmed(contact.print_as) ?? name },
    });
    const record = await sageIntacctClient.createRecord({ auth: context.auth, object: sageIntacctRecords.CUSTOMER_OBJECT, body });
    return sageIntacctRecords.toParty(record);
  },
});
