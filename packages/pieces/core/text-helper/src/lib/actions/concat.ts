import { Property, createAction } from '@activepieces/pieces-framework';

export const concat = createAction({
  audience: 'both',
  description: 'Concatenate two or more texts',
  aiMetadata: {
    description:
      'Joins a list of text values into a single string, optionally inserting a separator between each item. Use it to assemble one string from many parts (lines, CSV cells, name fragments); use Split for the reverse. Requires a Texts array - with no separator supplied the values are joined with no gap; deterministic and idempotent.',
    idempotent: true,
  },
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
    return (ctx.propsValue.texts ?? []).join(ctx.propsValue.separator ?? '');
  },
});
