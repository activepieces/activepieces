import { EntityProp } from '../types';

export const paymentMethodsEntityProps: EntityProp[] = [
  {
    name: 'code',
    displayName: 'Code',
    description: 'The code of the payment method.',

    type: 'text',
    isRequired: false,
  },
  {
    name: 'displayName',
    displayName: 'Display Name',
    description:
      "Specifies the payment method's name. This name will appear on all sales documents for the payment method.",
    type: 'text',
    isRequired: false,
  },
];
