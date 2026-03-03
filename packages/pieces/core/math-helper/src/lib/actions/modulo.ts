import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

export const modulo = createAction({
  name: 'modulo_math',
  auth: PieceAuth.None(),
  displayName: 'Modulo',
  description: 'Get the remainder of the first number divided by second number',
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
