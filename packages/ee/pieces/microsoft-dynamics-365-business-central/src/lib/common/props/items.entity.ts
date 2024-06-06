import { EntityProp } from '../types';

export const itemsEntityProps: EntityProp[] = [
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
      { label: 'Inventory', value: 'Inventory' },
      { label: 'Service', value: 'Service' },
      { label: 'Non-Inventory', value: 'Non-Inventory' },
    ],
  },
  {
    name: 'blocked',
    displayName: 'Blocked?',
    type: 'boolean',
    isRequired: false,
  },
  {
    name: 'itemCategoryId',
    displayName: 'Item Category ID',
    type: 'dynamic_select',
    isRequired: false,
    options: {
      sourceFieldSlug: 'itemCategories',
      labelField: 'code',
    },
  },
  {
    name: 'itemCategoryCode',
    displayName: 'Item Category Code',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'gtin',
    displayName: 'GTIN',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'unitPrice',
    displayName: 'Unit Price',
    type: 'number',
    isRequired: false,
  },
  {
    name: 'priceIncludesTax',
    displayName: 'Price Includes Tax?',
    description:
      'Specifies that the unitPrice includes tax. Set to true, if unitPrice includes tax.',
    type: 'boolean',
    isRequired: false,
  },
  {
    name: 'unitCost',
    displayName: 'Unit Cost',
    type: 'number',
    isRequired: false,
  },
  {
    name: 'baseUnitOfMeasureId',
    displayName: 'Basic Unit of Measure ID',
    isRequired: false,
    type: 'dynamic_select',
    options: {
      sourceFieldSlug: 'unitsOfMeasure',
      labelField: 'code',
    },
  },
  {
    name: 'baseUnitOfMeasureCode',
    displayName: 'Basic Unit of Measure Code',
    isRequired: false,
    type: 'text',
  },
  {
    name: 'taxGroupId',
    displayName: 'Tax Group ID',
    isRequired: false,
    type: 'dynamic_select',
    options: {
      sourceFieldSlug: 'taxGroups',
      labelField: 'code',
    },
  },
  {
    name: 'taxGroupCode',
    displayName: 'Tax Group Code',
    isRequired: false,
    type: 'text',
  },
];

export const itemsEntityNumberProps = ['unitPrice', 'unitCost'];
