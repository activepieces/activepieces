import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctBodies, sageIntacctProps } from '../common/props';

export const updateCustomerAction = createAction({
  auth: sageIntacctAuth,
  name: 'update_customer',
  displayName: 'Update Customer',
  description: 'Update fields on an existing Sage Intacct customer. Empty fields are left unchanged.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing Sage Intacct customer with PATCH, sending only the fields you fill; empty fields keep their current values. customer_key is the customer record key (from Find Customer or the New Customer trigger), not the customer ID. Fields: name, status ("active" or "inactive") and the default contact fields (print_as, company_name, first_name, last_name, email, phone, address). Returns the saved customer. Idempotent: repeating the same update leaves the same values.',
    idempotent: true,
  },
  props: {
    customer_key: sageIntacctProps.recordDropdown({
      object: sageIntacctRecords.CUSTOMER_OBJECT,
      displayName: 'Customer',
      description: 'The customer to update. In an agent, pass the customer record key.',
    }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    status: sageIntacctProps.statusProp(),
    ...sageIntacctProps.contactInfoProps(),
  },
  outputSchema: sageIntacctSchemas.customer,
  async run(context) {
    const { customer_key, name, status, ...contact } = context.propsValue;
    const key = sageIntacctBodies.recordKey(customer_key);
    if (!key) {
      throw new Error('Customer is required.');
    }
    const body = sageIntacctBodies.buildPartyBody({ name, status, contact });
    if (Object.keys(body).length === 0) {
      throw new Error('Fill at least one field to update.');
    }
    const record = await sageIntacctClient.updateRecord({ auth: context.auth, object: sageIntacctRecords.CUSTOMER_OBJECT, key, body });
    return sageIntacctRecords.toParty(record);
  },
});
