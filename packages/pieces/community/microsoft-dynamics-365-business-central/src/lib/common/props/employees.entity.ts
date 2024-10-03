import { EntityProp } from '../types';

export const employeesEntityProps: EntityProp[] = [
  {
    name: 'number',
    displayName: 'Number',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'givenName',
    displayName: 'First Name',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'middleName',
    displayName: 'Middle Name',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'surname',
    displayName: 'Last Name',
    type: 'text',
    isRequired: false,
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
    name: 'mobilePhone',
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
    name: 'personalEmail',
    displayName: 'Personal Email',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'status',
    displayName: 'Status',
    type: 'static_select',
    description: 'Specifies the status of the employee.',
    isRequired: false,
    options: [
      {
        label: 'Active',
        value: 'Active',
      },
      {
        label: 'Inactive',
        value: 'Inactive',
      },
      {
        label: 'Terminated',
        value: 'Terminated',
      },
    ],
  },
  {
    name: 'birthDate',
    displayName: 'Birth Date',
    type: 'date',
    isRequired: false,
  },
  {
    name: 'employmentDate',
    displayName: 'Employment Date',
    type: 'date',
    isRequired: false,
  },
];
