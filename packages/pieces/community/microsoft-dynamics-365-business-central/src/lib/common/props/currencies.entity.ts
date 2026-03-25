import { EntityProp } from '../types';

export const currenciesEntityProps: EntityProp[] = [
  {
    name: 'displayName',
    displayName: 'Display Name',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'code',
    displayName: 'Code',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'amountDecimalPlaces',
    displayName: 'Amount Decimal Places',
    description:
      'Specifies the number of decimal places the system will display on amounts for this currency.',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'amountRoundingPrecision',
    displayName: 'Amount Rounding Precision',
    type: 'number',
    isRequired: false,
  },
];

export const currenciesEntityNumberProps = ['amountRoundingPrecision'];
