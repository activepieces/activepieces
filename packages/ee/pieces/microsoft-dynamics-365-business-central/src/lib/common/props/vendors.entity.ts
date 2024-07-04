import { EntityProp } from '../types';

export const vendorsEntityProps: EntityProp[] = [
  {
    name: 'number',
    displayName: 'Number',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'displayName',
    displayName: 'Display Name',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'addressLine1',
    displayName: 'Address Line 1',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'addressLine2',
    displayName: 'Address Line 2',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'city',
    displayName: 'City',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'state',
    displayName: 'State',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'country',
    displayName: 'Country',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'postalCode',
    displayName: 'Postal Code',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'email',
    displayName: 'Email',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'website',
    displayName: 'Website',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'taxLiable',
    displayName: 'Tax Liable?',
    type: 'boolean',
    isRequired: false,
  },
  {
    name: 'taxRegistrationNumber',
    displayName: 'Tax Registration Number',
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
    name: 'paymentMethodId',
    displayName: 'Payment Method ID',
    type: 'dynamic_select',
    isRequired: false,
    options: {
      sourceFieldSlug: 'paymentMethods',
      labelField: 'code',
    },
  },
];
