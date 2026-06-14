import { Property, createAction } from '@activepieces/pieces-framework';

export const find = createAction({
  audience: 'human',
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
      displayName: 'Text',
      required: true,
    }),
    expression: Property.ShortText({
      displayName: 'Expression',
      description:
        'Regex or text to search for. Returns the first match and its capture groups.',
      required: true,
    }),
    ignoreCase: Property.Checkbox({
      displayName: 'Ignore Case',
      description: 'When enabled, matching is case-insensitive.',
      required: false,
      defaultValue: false,
    }),
  },
  run: async (ctx): Promise<RegExpMatchArray | null> => {
    const flags = ctx.propsValue.ignoreCase ? 'i' : '';
    let expression: RegExp;
    try {
      expression = new RegExp(ctx.propsValue.expression, flags);
    } catch {
      throw new Error(
        `Invalid regular expression: ${ctx.propsValue.expression}`
      );
    }
    return ctx.propsValue.text.match(expression);
  },
});
