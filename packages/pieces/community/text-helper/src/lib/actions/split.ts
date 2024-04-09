import { Property, Validators, createAction } from '@activepieces/pieces-framework';

export const split = createAction({
  description: 'Split a text by a delimiter',
  displayName: 'Split',
  name: 'split',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    text: Property.ShortText({
      displayName: 'Text',
      required: true,
    }),
    delimiter: Property.ShortText({
      displayName: 'Delimiter',
      required: true,
    }),
  },
  run: async (ctx) => {
    return ctx.propsValue.text.split(ctx.propsValue.delimiter);
  },
});
