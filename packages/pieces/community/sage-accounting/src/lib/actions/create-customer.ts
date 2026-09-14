import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { contactDetailProps, contactPropertyGroups, buildContactAddressAndDetailFields, putContactDetailsOrRollback } from '../common/contact-props';
import { createCustomerActionOutputSchema } from '../output-schemas';

export const createCustomerAction = createAction({
  auth: sageAccountingAuth,
  name: 'create_customer',
  classification: 'WRITE',
  displayName: 'Create Customer',
  description: 'Creates a new customer contact in Sage Accounting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new customer contact in Sage Accounting. Use when you need to add a customer that does not already exist; for changing an existing customer use Update Contact instead. Each call creates a new customer, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createCustomerActionOutputSchema,
  propertyGroups: contactPropertyGroups,
  props: {
    name: Property.ShortText({
      displayName: 'Business Name',
      description: 'The customer\'s full name or business name, e.g. "Starluck".',
      required: true,
    }),
    ...contactDetailProps,
    defaultLedgerAccount: sageAccountingDropdowns.defaultSalesLedgerAccountId,
  },
  async run(context) {
    const { name, defaultLedgerAccount, ...rest } = context.propsValue;
    const accessToken = context.auth.access_token;

    const created = await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken,
      method: HttpMethod.POST,
      path: sageAccountingClient.paths.contacts,
      body: {
        contact: {
          name,
          contact_type_ids: [sageAccountingClient.contactTypes.customer],
          ...(defaultLedgerAccount !== undefined ? { default_sales_ledger_account_id: defaultLedgerAccount } : {}),
        },
      },
    });

    const detailFields = buildContactAddressAndDetailFields(rest, { contactPersonName: name });
    if (Object.keys(detailFields).length === 0) {
      return created;
    }

    return await putContactDetailsOrRollback({ accessToken, contactId: created.id, detailFields });
  },
});
