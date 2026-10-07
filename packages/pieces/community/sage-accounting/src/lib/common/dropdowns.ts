import { Property } from '@activepieces/pieces-framework';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';

function referenceDropdown({
  displayName,
  description,
  path,
  contactTypeId,
  required = true,
}: {
  displayName: string;
  description: string;
  path: string;
  contactTypeId?: string;
  required?: boolean;
}) {
  return Property.Dropdown({
    displayName,
    description,
    auth: sageAccountingAuth,
    refreshers: [],
    required,
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your account first',
        };
      }
      const { items } = await sageAccountingClient.list<SageAccountingRef>({
        accessToken: auth.access_token,
        path,
        query: {
          ...(contactTypeId ? { contact_type_id: contactTypeId } : {}),
          ...(searchValue ? { search: searchValue } : {}),
          items_per_page: '100',
        },
      });
      return {
        disabled: false,
        options: items.map((item) => ({ label: item.displayed_as, value: item.id })),
      };
    },
  });
}

export const sageAccountingDropdowns = {
  contactById: referenceDropdown({
    displayName: 'Contact',
    description: 'The contact to update.',
    path: sageAccountingClient.paths.contacts,
  }),
  contactFilter: referenceDropdown({
    displayName: 'Contact',
    description: 'Only return records for this contact.',
    path: sageAccountingClient.paths.contacts,
    required: false,
  }),
  customerById: referenceDropdown({
    displayName: 'Customer',
    description: 'The customer this invoice is billed to.',
    path: sageAccountingClient.paths.contacts,
    contactTypeId: sageAccountingClient.contactTypes.customer,
  }),
  customerFilter: referenceDropdown({
    displayName: 'Customer',
    description: 'Only return invoices billed to this customer.',
    path: sageAccountingClient.paths.contacts,
    contactTypeId: sageAccountingClient.contactTypes.customer,
    required: false,
  }),
  vendorById: referenceDropdown({
    displayName: 'Vendor',
    description: 'The vendor this invoice is owed to.',
    path: sageAccountingClient.paths.contacts,
    contactTypeId: sageAccountingClient.contactTypes.vendor,
  }),
  vendorFilter: referenceDropdown({
    displayName: 'Vendor',
    description: 'Only return invoices owed to this vendor.',
    path: sageAccountingClient.paths.contacts,
    contactTypeId: sageAccountingClient.contactTypes.vendor,
    required: false,
  }),
  salesInvoiceById: referenceDropdown({
    displayName: 'Sales Invoice',
    description: 'The sales invoice to update.',
    path: sageAccountingClient.paths.salesInvoices,
  }),
  purchaseInvoiceById: referenceDropdown({
    displayName: 'Purchase Invoice',
    description: 'The purchase invoice to update.',
    path: sageAccountingClient.paths.purchaseInvoices,
  }),
  contactPaymentById: referenceDropdown({
    displayName: 'Contact Payment',
    description: 'The contact payment to update.',
    path: sageAccountingClient.paths.contactPayments,
  }),
  contactIdOptional: referenceDropdown({
    displayName: 'Contact',
    description: 'The contact of the payment.',
    path: sageAccountingClient.paths.contacts,
    required: false,
  }),
  productById: referenceDropdown({
    displayName: 'Product',
    description: 'The product to update.',
    path: sageAccountingClient.paths.products,
  }),
  serviceById: referenceDropdown({
    displayName: 'Service',
    description: 'The service to update.',
    path: sageAccountingClient.paths.services,
  }),
  stockItemById: referenceDropdown({
    displayName: 'Stock Item',
    description: 'The stock item to update.',
    path: sageAccountingClient.paths.stockItems,
  }),
  salesQuoteById: referenceDropdown({
    displayName: 'Sales Quote',
    description: 'The sales quote to update.',
    path: sageAccountingClient.paths.salesQuotes,
  }),
  bankAccountId: referenceDropdown({
    displayName: 'Bank Account',
    description: 'The bank account this transaction is recorded against.',
    path: sageAccountingClient.paths.bankAccounts,
  }),
  bankAccountIdOptional: referenceDropdown({
    displayName: 'Bank Account',
    description: 'The bank account this transaction is recorded against.',
    path: sageAccountingClient.paths.bankAccounts,
    required: false,
  }),
  paymentMethodId: referenceDropdown({
    displayName: 'Payment Method',
    description: 'How the payment was made.',
    path: sageAccountingClient.paths.paymentMethods,
    required: false,
  }),
  transactionTypeId: referenceDropdown({
    displayName: 'Transaction Type',
    description: 'The direction and kind of transaction, e.g. "Customer Receipt" or "Supplier Payment".',
    path: sageAccountingClient.paths.transactionTypes,
  }),
  transactionTypeIdOptional: referenceDropdown({
    displayName: 'Transaction Type',
    description: 'The direction and kind of transaction, e.g. "Customer Receipt" or "Supplier Payment".',
    path: sageAccountingClient.paths.transactionTypes,
    required: false,
  }),
  taxRateId: referenceDropdown({
    displayName: 'Tax Rate',
    description: 'The tax rate to apply.',
    path: sageAccountingClient.paths.taxRates,
    required: false,
  }),
  countryId: referenceDropdown({
    displayName: 'Country',
    description: 'The country of this address.',
    path: sageAccountingClient.paths.countries,
    required: false,
  }),
  countryGroupId: referenceDropdown({
    displayName: 'Country Group',
    description: 'The country group of this address.',
    path: sageAccountingClient.paths.countryGroups,
    required: false,
  }),
  productSalesPriceTypeId: referenceDropdown({
    displayName: 'Product Sales Price Type',
    description: 'The price list this contact is charged from, e.g. "Trade" or "Wholesale".',
    path: sageAccountingClient.paths.productSalesPriceTypes,
    required: false,
  }),
  defaultSalesLedgerAccountId: referenceDropdown({
    displayName: 'Default Sales Ledger Account',
    description: 'The default ledger account sales to this contact are posted to.',
    path: sageAccountingClient.paths.ledgerAccounts,
    required: false,
  }),
  defaultPurchaseLedgerAccountId: referenceDropdown({
    displayName: 'Default Purchase Ledger Account',
    description: 'The default ledger account purchases from this contact are posted to.',
    path: sageAccountingClient.paths.ledgerAccounts,
    required: false,
  }),
  productSalesLedgerAccountId: referenceDropdown({
    displayName: 'Sales Ledger Account',
    description: 'The ledger account to post sales of this product to.',
    path: sageAccountingClient.paths.ledgerAccounts,
  }),
  productPurchaseLedgerAccountId: referenceDropdown({
    displayName: 'Purchase Ledger Account',
    description: 'The ledger account to post purchases of this product to.',
    path: sageAccountingClient.paths.ledgerAccounts,
  }),
  productSalesLedgerAccountIdOptional: referenceDropdown({
    displayName: 'Sales Ledger Account',
    description: 'The ledger account to post sales of this product to.',
    path: sageAccountingClient.paths.ledgerAccounts,
    required: false,
  }),
  productPurchaseLedgerAccountIdOptional: referenceDropdown({
    displayName: 'Purchase Ledger Account',
    description: 'The ledger account to post purchases of this product to.',
    path: sageAccountingClient.paths.ledgerAccounts,
    required: false,
  }),
  salesTaxRateId: referenceDropdown({
    displayName: 'Sales Tax Rate',
    description: 'The tax rate to apply when this product is sold.',
    path: sageAccountingClient.paths.taxRates,
    required: false,
  }),
  purchaseTaxRateId: referenceDropdown({
    displayName: 'Purchase Tax Rate',
    description: 'The tax rate to apply when this product is purchased.',
    path: sageAccountingClient.paths.taxRates,
    required: false,
  }),
  usualSupplierId: referenceDropdown({
    displayName: 'Usual Supplier',
    description: 'The vendor this product is usually purchased from.',
    path: sageAccountingClient.paths.contacts,
    contactTypeId: sageAccountingClient.contactTypes.vendor,
    required: false,
  }),
  artefactStatusId: referenceDropdown({
    displayName: 'Status',
    description: 'Only return invoices with this status, e.g. "Paid" or "Overdue".',
    path: sageAccountingClient.paths.artefactStatuses,
    required: false,
  }),
  addressTypeId: referenceDropdown({
    displayName: 'Address Type',
    description: 'The type of this address, e.g. "Billing" or "Delivery".',
    path: sageAccountingClient.paths.addressTypes,
    required: false,
  }),
};
