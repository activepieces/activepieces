import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

export const subtraction = createAction({
  name: 'subtraction_math',
  auth: PieceAuth.None(),
  displayName: 'Subtraction',
  description: 'Subtract the first number from the second number',
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
      context.propsValue['second_number'] - context.propsValue['first_number']
    );
  },
});
