import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { contactDetailProps, contactPropertyGroups, buildContactAddressAndDetailFields, putContactDetailsOrRollback } from '../common/contact-props';
import { createVendorActionOutputSchema } from '../output-schemas';

export const createVendorAction = createAction({
  auth: sageAccountingAuth,
  name: 'create_vendor',
  classification: 'WRITE',
  displayName: 'Create Vendor',
  description: 'Creates a new vendor contact in Sage Accounting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new vendor contact in Sage Accounting. Use when you need to add a vendor that does not already exist; for changing an existing vendor use Update Contact instead. Each call creates a new vendor, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createVendorActionOutputSchema,
  propertyGroups: contactPropertyGroups,
  props: {
    name: Property.ShortText({
      displayName: 'Business Name',
      description: 'The vendor\'s full name or business name, e.g. "Acme Supplies".',
      required: true,
    }),
    ...contactDetailProps,
    defaultLedgerAccount: sageAccountingDropdowns.defaultPurchaseLedgerAccountId,
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
          contact_type_ids: [sageAccountingClient.contactTypes.vendor],
          ...(defaultLedgerAccount !== undefined ? { default_purchase_ledger_account_id: defaultLedgerAccount } : {}),
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
