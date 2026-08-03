import { Property, createAction } from '@activepieces/pieces-framework';

export const replace = createAction({
  audience: 'both',
  description:
    'Replaces all instances of any word, character or phrase in text, with another.',
  aiMetadata: {
    description:
      'Substitutes matches of a search pattern inside a text with a replacement value, either every occurrence (default) or only the first match. Use it to rewrite or delete substrings - prefer Find or Find All when you only need to locate matches, and Split when you want the surrounding segments. The search value is always compiled as a regular expression, so regex metacharacters must be escaped, and an empty replacement deletes the matches; deterministic and idempotent.',
    idempotent: true,
  },
  displayName: 'Replace',
  name: 'replace',
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
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Can be plain text or a regex expression.',
      required: true,
    }),
    replaceValue: Property.ShortText({
      displayName: 'Replace Value',
      required: false,
      description: 'Leave empty to delete found results.',
    }),
    replaceOnlyFirst: Property.Checkbox({
      displayName: 'Replace Only First Match',
      required: false,
      description: 'Only replaces the first instance of the search value.',
    }),
  },
  run: async (ctx) => {
    if (ctx.propsValue.replaceOnlyFirst) {
      const expression = RegExp(ctx.propsValue.searchValue);
      return ctx.propsValue.text.replace(
        expression,
        ctx.propsValue.replaceValue || ''
      );
    }
    const expression = RegExp(ctx.propsValue.searchValue, 'g');
    return ctx.propsValue.text.replaceAll(
      expression,
      ctx.propsValue.replaceValue || ''
    );
  },
});
