import { EntityProp } from '../types';

export const itemCategoriesEntityProps: EntityProp[] = [
  {
    name: 'code',
    displayName: 'Code',
    description: 'The code of the item category.',

    type: 'text',
    isRequired: false,
  },
  {
    name: 'displayName',
    displayName: 'Display Name',
    description:
      "Specifies the item category's name. This name will appear on all sales documents for the item category.",
    type: 'text',
    isRequired: false,
  },
];
