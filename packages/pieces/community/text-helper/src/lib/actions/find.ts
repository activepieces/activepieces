import { Property, createAction } from '@activepieces/pieces-framework';

export const find = createAction({
  description: 'Find substring (Regex or Text).',
  displayName: 'Find',
  name: 'find',
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
      displayName: 'text',
      required: true,
    }),
    expression: Property.ShortText({
      displayName: 'Expression',
      description: 'Regex or text to search for.',
      required: true,
    }),
  },
  run: async (ctx): Promise<RegExpMatchArray | null> => {
    const expression = RegExp(ctx.propsValue.expression);
    return ctx.propsValue.text.match(expression);
  },
});
