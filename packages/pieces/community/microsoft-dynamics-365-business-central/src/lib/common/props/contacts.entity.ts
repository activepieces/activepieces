import { EntityProp } from '../types';

export const contactsEntityProps: EntityProp[] = [
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
    name: 'type',
    displayName: 'Type',
    type: 'static_select',
    isRequired: false,
    options: [
      {
        label: 'Person',
        value: 'Person',
      },
      {
        label: 'Company',
        value: 'Company',
      },
    ],
  },
  {
    name: 'jobTitle',
    displayName: 'Job Title',
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
    name: 'mobilePhoneNumber',
    displayName: 'Mobile Number',
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
    name: 'privacyBlocked',
    displayName: 'Privacy Blocked?',
    type: 'boolean',
    isRequired: false,
  },
  {
    name: 'taxRegistrationNumber',
    displayName: 'Tax Registration Number',
    type: 'text',
    isRequired: false,
  },
];
