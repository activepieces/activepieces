import { EntityProp } from '../types';

export const shipmentMethodsEntityProps: EntityProp[] = [
  {
    name: 'displayName',
    displayName: 'Display Name',
    description:
      "Specifies the shipment method's name. This name will appear on all sales documents for the shipment method.",
    type: 'text',
    isRequired: false,
  },
  {
    name: 'code',
    displayName: 'Code',
    description: 'TThe code of the shipment method.',
    type: 'text',
    isRequired: false,
  },
];
