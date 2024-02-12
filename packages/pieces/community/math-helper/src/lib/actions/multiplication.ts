import {
  PieceAuth,
  Property,
  createAction,
} from '@activepieces/pieces-framework';

export const multiplication = createAction({
  name: 'multiplication_math',
  auth: PieceAuth.None(),
  displayName: 'Multiplicattion',
  description: 'Multiply first number by the second number',
  errorHandlingOptions: {
    continueOnFailure: {
      defaultValue: false,
      hide: true,
    },
    retryOnFailure: {
      defaultValue: false,
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
      context.propsValue['first_number'] * context.propsValue['second_number']
    );
  },
});
