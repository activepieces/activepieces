import { Property, createAction } from '@activepieces/pieces-framework';

export const concat = createAction({
  description: 'Concatenate two or more texts',
  displayName: 'Concatenate',
  name: 'concat',
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
    texts: Property.Array({
      displayName: 'Texts',
      required: true,
    }),
    seperator: Property.ShortText({
      displayName: 'Seperator',
      description: 'The text that seperates the texts you want to concatenate',
      required: false,
    }),
  },
  run: async (ctx) => {
    return ctx.propsValue.texts.join(ctx.propsValue.seperator ?? '');
  },
});
