import { Property, createAction } from '@activepieces/pieces-framework';

export const split = createAction({
  audience: 'both',
  description: 'Split a text by a delimiter',
  aiMetadata: {
    description:
      'Breaks a text into an array of parts at every occurrence of a delimiter. Use it when you need the segments of a string (lines, CSV fields, the halves of a key/value pair); use Concatenate to rejoin them, or Find All when you want the matches themselves rather than the segments between them. The delimiter is required and matched as a literal string, not as a regex; deterministic and idempotent.',
    idempotent: true,
  },
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
