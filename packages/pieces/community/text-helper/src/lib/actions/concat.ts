import { Property, createAction } from '@activepieces/pieces-framework';

export const concat = createAction({
  description: 'Concatenate two or more texts',
  displayName: 'Concatenate',
  name: 'concat',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    texts: Property.Array({
      displayName: 'Texts',
      required: true,
    }),
    separator: Property.ShortText({
      displayName: 'Separator',
      description: 'The text that separates the texts you want to concatenate',
      required: false,
    }),
  },
  run: async (ctx) => {
    return ctx.propsValue.texts.join(ctx.propsValue.separator ?? '');
  },
});
