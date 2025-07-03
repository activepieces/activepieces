import { EntityProp } from '../types';

export const locationsEntityProps: EntityProp[] = [
  {
    name: 'code',
    displayName: 'Code',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'displayName',
    displayName: 'Display Name',
    description:
      "Specifies the location's name. This name will appear on all sales documents for the location.",
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
    name: 'phoneNumber',
    displayName: 'Phone Number',
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
];
