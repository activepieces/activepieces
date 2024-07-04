import { EntityProp } from '../types';

export const bankAccountsEntityProps: EntityProp[] = [
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
    name: 'bankAccountNumber',
    displayName: 'Bank Account Number',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'blocked',
    displayName: 'Blocked ?',
    type: 'boolean',
    isRequired: false,
  },
  {
    name: 'iban',
    displayName: 'IBAN',
    type: 'text',
    isRequired: false,
  },
];
