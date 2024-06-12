import { EntityProp } from '../types';

export const disputeStatusEntityProps: EntityProp[] = [
  {
    name: 'code',
    displayName: 'Code',
    description: 'The code of the dispute status.',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'displayName',
    displayName: 'Display Name',
    description: `Specifies the dispute status's name. This name will appear on all sales documents for the dispute status.`,
    type: 'text',
    isRequired: false,
  },
];
