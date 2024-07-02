import { EntityProp } from '../types';

export const journalsEntityProps: EntityProp[] = [
  {
    name: 'code',
    displayName: 'Code',
    description: 'The code of the journal.',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'displayName',
    displayName: 'Display Name',
    description:
      "Specifies the journal's name. This name will appear on all sales documents for the journal.",
    type: 'text',
    isRequired: false,
  },
  {
    name: 'balancingAccountNumber',
    displayName: 'Balancing Account Number',
    type: 'text',
    isRequired: false,
  },
];
