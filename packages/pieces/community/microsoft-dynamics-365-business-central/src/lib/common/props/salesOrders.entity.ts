import { EntityProp } from '../types';

export const salesOrdersEntityProps: EntityProp[] = [
  {
    name: 'orderDate',
    displayName: 'Order Date',
    type: 'date',
    isRequired: false,
  },
  {
    name: 'postingDate',
    displayName: 'Posting Date',
    type: 'date',
    isRequired: false,
  },
  {
    name: 'customerId',
    displayName: 'Customer ID',
    type: 'dynamic_select',
    isRequired: false,
    options: {
      sourceFieldSlug: 'customers',
      labelField: 'displayName',
    },
  },
  {
    name: 'customerNumber',
    displayName: 'Customer Number',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'billToCustomerId',
    displayName: 'Bill to Customer ID',
    type: 'dynamic_select',
    isRequired: false,
    options: {
      sourceFieldSlug: 'customers',
      labelField: 'displayName',
    },
  },
  {
    name: 'billToCustomerNumber',
    displayName: 'Bill to Customer Number',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'shipToName',
    displayName: 'Ship to Name',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'shipToContact',
    displayName: 'Ship to Contact',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'shipToAddressLine1',
    displayName: 'Ship to Address Line 1',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'shipToAddressLine2',
    displayName: 'Ship to Address Line 2',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'shipToCity',
    displayName: 'Ship to City',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'shipToCountry',
    displayName: 'Ship to Country',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'shipToState',
    displayName: 'Ship to State',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'shipToPostCode',
    displayName: 'Ship to Postalcode',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'sellToAddressLine1',
    displayName: 'Sell to Address Line 1',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'sellToAddressLine2',
    displayName: 'Sell to Address Line 2',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'sellToCity',
    displayName: 'Sell to City',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'sellToCountry',
    displayName: 'Sell to Country',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'sellToState',
    displayName: 'Sell to State',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'sellToPostCode',
    displayName: 'Sell to Postalcode',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'currencyId',
    displayName: 'Currency ID',
    type: 'dynamic_select',
    isRequired: false,
    options: {
      labelField: 'code',
      sourceFieldSlug: 'currencies',
    },
  },
  {
    name: 'currencyCode',
    displayName: 'Currency Code',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'pricesIncludeTax',
    displayName: 'Prices include Tax?',
    isRequired: false,
    type: 'boolean',
  },
  {
    name: 'paymentTermsId',
    displayName: 'Payment Terms ID',
    type: 'dynamic_select',
    isRequired: false,
    options: {
      sourceFieldSlug: 'paymentTerms',
      labelField: 'code',
    },
  },
  {
    name: 'shipmentMethodId',
    displayName: 'Shipment Method ID',
    type: 'dynamic_select',
    isRequired: false,
    options: {
      sourceFieldSlug: 'shipmentMethods',
      labelField: 'code',
    },
  },
  {
    name: 'salesperson',
    displayName: 'Sales Person Code',
    description: 'The salesperson code for the sales order.',
    isRequired: false,
    type: 'text',
  },
  {
    name: 'partialShipping',
    displayName:
      'Specifies whether partial shipping of items is preferred or not.',
    type: 'boolean',
    isRequired: false,
  },
  {
    name: 'requestedDeliveryDate',
    displayName: 'Requested Delivery Date',
    type: 'date',
    isRequired: false,
  },
  {
    name: 'phoneNumber',
    displayName: 'Phone Number',
    description: "Specifies the sales order's telephone number.",
    type: 'text',
    isRequired: false,
  },
  {
    name: 'email',
    displayName: 'Email',
    description: "Specifies the sales order's email address.",
    type: 'text',
    isRequired: false,
  },
  {
    name: 'fullyShipped',
    displayName: 'Fully Shipped?',
    description:
      'Specifies whether the items of the sales order were fully shipped or not.',
    type: 'boolean',
    isRequired: false,
  },
];

export const salesOrderLinesEntityNumberProps = ['discountAmount'];
