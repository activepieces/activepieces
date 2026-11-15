import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { contactDetailProps, contactPropertyGroups, buildContactAddressAndDetailFields } from '../common/contact-props';
import { updateContactActionOutputSchema } from '../output-schemas';

export const updateContactAction = createAction({
  auth: sageAccountingAuth,
  name: 'update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Updates an existing customer or vendor contact in Sage Accounting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update fields on an existing Sage Accounting contact (customer or vendor), identified by its ID. Only the fields you provide are changed. Safe to retry with the same values.',
    idempotent: true,
  },
  outputSchema: updateContactActionOutputSchema,
  propertyGroups: contactPropertyGroups,
  props: {
    contact: sageAccountingDropdowns.contactById,
    name: Property.ShortText({ displayName: 'Name', required: false }),
    defaultSalesLedgerAccount: sageAccountingDropdowns.defaultSalesLedgerAccountId,
    defaultPurchaseLedgerAccount: sageAccountingDropdowns.defaultPurchaseLedgerAccountId,
    ...contactDetailProps,
  },
  async run(context) {
    const { contact, name, defaultSalesLedgerAccount, defaultPurchaseLedgerAccount, ...rest } = context.propsValue;
    const accessToken = context.auth.access_token;

    const hasAnyDetailField = Object.values(rest).some((value) => value !== undefined);
    let fallbacks: { mainAddressName?: string; deliveryAddressName?: string; contactPersonName?: string } = {};
    if (hasAnyDetailField) {
      const current = await sageAccountingClient.apiCall<ExistingContactNames>({
        accessToken,
        method: HttpMethod.GET,
        path: `${sageAccountingClient.paths.contacts}/${contact}`,
        query: { nested_attributes: 'all' },
      });
      fallbacks = {
        mainAddressName: current.main_address?.name,
        deliveryAddressName: current.delivery_address?.name,
        contactPersonName: current.main_contact_person?.name,
      };
    }

    return await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken,
      method: HttpMethod.PUT,
      path: `${sageAccountingClient.paths.contacts}/${contact}`,
      body: {
        contact: {
          ...(name !== undefined ? { name } : {}),
          ...(defaultSalesLedgerAccount !== undefined ? { default_sales_ledger_account_id: defaultSalesLedgerAccount } : {}),
          ...(defaultPurchaseLedgerAccount !== undefined ? { default_purchase_ledger_account_id: defaultPurchaseLedgerAccount } : {}),
          ...buildContactAddressAndDetailFields(rest, fallbacks),
        },
      },
    });
  },
});

type ExistingContactNames = {
  main_address: { name?: string } | null;
  delivery_address: { name?: string } | null;
  main_contact_person: { name?: string } | null;
};
