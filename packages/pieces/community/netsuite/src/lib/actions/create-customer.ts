import { createAction, Property } from '@activepieces/pieces-framework';
import { netsuiteAuth } from '../..';
import { NetSuiteClient } from '../common/client';
import { netsuiteRecords } from '../common/records';

export const createCustomer = createAction({
  name: 'createCustomer',
  auth: netsuiteAuth,
  displayName: 'Create Customer',
  description: 'Creates a customer in NetSuite.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a customer record in NetSuite. Provide a company name (for companies) or first/last name with "Is Individual" enabled (for people). Returns the new customer id. This is a write action and is NOT safe to repeat unless an External ID is set for idempotency.',
    idempotent: false,
  },
  props: {
    isPerson: Property.Checkbox({
      displayName: 'Is Individual',
      description: 'Enable for a person, disable for a company.',
      required: false,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    subsidiaryId: Property.ShortText({
      displayName: 'Subsidiary ID',
      description: 'Internal id of the subsidiary. Required on OneWorld accounts.',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'Your own unique id for this customer; useful for idempotency.',
      required: false,
    }),
    additionalFields: netsuiteRecords.additionalFieldsProp,
  },
  async run(context) {
    const client = new NetSuiteClient(context.auth.props);
    const {
      isPerson,
      companyName,
      firstName,
      lastName,
      email,
      phone,
      subsidiaryId,
      externalId,
      additionalFields,
    } = context.propsValue;

    const body = netsuiteRecords.compact({
      isPerson: isPerson ?? false,
      companyName,
      firstName,
      lastName,
      email,
      phone,
      subsidiary: netsuiteRecords.toRef(subsidiaryId),
      externalId,
      ...(additionalFields ?? {}),
    });

    return client.createRecord({ recordType: 'customer', body });
  },
});
