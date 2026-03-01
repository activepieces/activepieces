import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

export const addition = createAction({
  name: 'addition_math',
  auth: PieceAuth.None(),
  displayName: 'Addition',
  description: 'Add the first number and the second number',
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
      context.propsValue['first_number'] + context.propsValue['second_number']
    );
  },
});
