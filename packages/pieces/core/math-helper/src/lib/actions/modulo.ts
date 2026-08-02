import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

export const modulo = createAction({
  audience: 'both',
  name: 'modulo_math',
  auth: PieceAuth.None(),
  displayName: 'Modulo',
  description: 'Get the remainder of the first number divided by second number',
  aiMetadata: { description: 'Compute the remainder of first_number divided by second_number using JavaScript % semantics, so the sign of the result follows the dividend (-7 with divisor 3 yields -1, not 2). Pick this for divisibility or every-Nth checks and for cycling an index over a fixed range; use the sibling Division action when you want the quotient instead. Unlike Division, second_number is not validated here, so a zero divisor returns NaN rather than failing the step; read-only and idempotent.', idempotent: true },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    first_number: Property.Number({
      displayName: 'First Number',
      description: undefined,
      required: true,
    }),
    second_number: Property.Number({
      displayName: 'Second Number',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    return (
      context.propsValue['first_number'] % context.propsValue['second_number']
    );
  },
});
