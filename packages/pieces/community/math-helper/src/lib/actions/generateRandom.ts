import {
  PieceAuth,
  Property,
  createAction,
} from '@activepieces/pieces-framework';

export const generateRandom = createAction({
  name: 'generateRandom_math',
  auth: PieceAuth.None(),
  displayName: 'Generate Random Number',
  description: 'Generate random number between two numbers (inclusive)',
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
    const min = context.propsValue['first_number'];
    const max = context.propsValue['second_number'];
    return Math.floor(Math.random() * (max - min + 1) + min);
  },
});
