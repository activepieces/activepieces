import { Property, createAction } from '@activepieces/pieces-framework';

export const findAll = createAction({
  audience: 'both',
  description: 'Find all substrings matching a regex or text pattern.',
  aiMetadata: {
    description:
      'Returns every substring of a text that matches a regex or plain-text pattern, with an optional case-insensitive mode. Use it when you need all occurrences; prefer Find when one match is enough or when you need capture groups, since this action returns only the whole-match text. The pattern is compiled as a regular expression and an invalid one throws; deterministic and idempotent.',
    idempotent: true,
  },
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
