import { Property, createAction } from '@activepieces/pieces-framework';

export const findAll = createAction({
  description: 'Find all substrings matching a regex or text pattern.',
  displayName: 'Find All',
  name: 'find_all',
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
      description: 'Regex or text to search for. Returns every occurrence.',
      required: true,
    }),
    ignoreCase: Property.Checkbox({
      displayName: 'Ignore Case',
      description: 'When enabled, matching is case-insensitive.',
      required: false,
      defaultValue: false,
    }),
  },
  run: async (ctx): Promise<string[]> => {
    const flags = ctx.propsValue.ignoreCase ? 'gi' : 'g';
    let regex: RegExp;
    try {
      regex = new RegExp(ctx.propsValue.expression, flags);
    } catch {
      throw new Error(
        `Invalid regular expression: ${ctx.propsValue.expression}`
      );
    }
    return [...ctx.propsValue.text.matchAll(regex)].map((m) => m[0]);
  },
});
