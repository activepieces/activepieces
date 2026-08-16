import { Property, createAction } from '@activepieces/pieces-framework';

export const find = createAction({
  audience: 'both',
  description: 'Find substring (Regex or Text).',
  aiMetadata: {
    description:
      'Matches a regex or plain-text pattern against a text and returns the first match along with its capture groups, with an optional case-insensitive mode. Pick it to test whether a pattern occurs or to pull one value out via a capture group; use Find All for every occurrence, or Replace to change the matched text. The pattern is compiled as a regular expression and an invalid one throws; deterministic and idempotent.',
    idempotent: true,
  },
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
