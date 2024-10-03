export const ACTION_ENTITY_DROPDOWN_OPTIONS = [
  {
    label: 'Bank Accounts',
    value: 'bankAccounts',
  },
  {
    label: 'Contacts',
    value: 'contacts',
  },
  {
    label: 'Currencies',
    value: 'currencies',
  },
  {
    label: 'Customers',
    value: 'customers',
  },
  {
    label: 'Dispute Status',
    value: 'disputeStatus',
  },
  {
    label: 'Employees',
    value: 'employees',
  },
  {
    label: 'Item Categories',
    value: 'itemCategories',
  },
  {
    label: 'Items',
    value: 'items',
  },
  {
    label: 'Item Variants',
    value: 'itemVariants',
  },
  {
    label: 'Journals',
    value: 'journals',
  },
  {
    label: 'Locations',
    value: 'locations',
  },
  {
    label: 'Payment Methods',
    value: 'paymentMethods',
  },
  {
    label: 'Payment Terms',
    value: 'paymentTerms',
  },
  {
    label: 'Projects',
    value: 'projects',
  },
  {
    label: 'Sales Invoice Lines',
    value: 'salesInvoiceLines',
  },
  {
    label: 'Sales Invoices',
    value: 'salesInvoices',
  },
  {
    label: 'Sales Order Lines',
    value: 'salesOrderLines',
  },
  {
    label: 'Sales Orders',
    value: 'salesOrders',
  },
  {
    label: 'Sales Quote Lines',
    value: 'salesQuoteLines',
  },
  {
    label: 'Sales Quotes',
    value: 'salesQuotes',
  },
  {
    label: 'Shipment Methods',
    value: 'shipmentMethods',
  },
  {
    label: 'Vendors',
    value: 'vendors',
  },
];

export const TRIGGER_ENTITY_DROPDOWN_OPTIONS =
  ACTION_ENTITY_DROPDOWN_OPTIONS.filter(
    (option) =>
      !['salesQuoteLines', 'salesOrderLines', 'salesInvoiceLines'].includes(
        option.value
      )
  );
