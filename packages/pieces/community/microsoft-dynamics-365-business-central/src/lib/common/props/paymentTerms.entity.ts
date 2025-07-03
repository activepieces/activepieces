import { EntityProp } from '../types';

export const paymentTermsEntityProps: EntityProp[] = [
  {
    name: 'code',
    displayName: 'Code',
    description: 'The code of the payment term.',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'displayName',
    displayName: 'Display Name',
    description:
      "Specifies the payment term's name. This name will appear on all sales documents for the payment term.",
    type: 'text',
    isRequired: false,
  },
  {
    name: 'dueDateCalculation',
    displayName: 'Due Date Calculation',
    description:
      'Specifies the formula that is used to calculate the date that a payment must be made.',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'discountDateCalculation',
    displayName: 'Discount Date Calculation',
    description:
      'Specifies the formula that is used to calculate the date that a payment must be made in order to obtain a discount.',
    type: 'text',
    isRequired: false,
  },
  {
    name: 'discountPercent',
    displayName: 'Discount Percent',
    type: 'number',
    isRequired: false,
  },
  {
    name: 'calculateDiscountOnCreditMemos',
    displayName: 'Calc. Pmt. Disc. on Credit Memos',
    type: 'boolean',
    description:
      'Specifies if the discount should be applied to payment term. True indicates a discount will be given, false indicates a discount will not be given.',
    isRequired: false,
  },
];

export const paymentTermsEntityNumberProps = ['discountPercent'];
