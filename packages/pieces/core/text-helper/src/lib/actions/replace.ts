import { Property, createAction } from '@activepieces/pieces-framework';

export const replace = createAction({
  audience: 'both',
  description: 'Replace matches of a word, phrase or pattern in a text.',
  aiMetadata: {
    description:
      'Substitutes matches of a search pattern inside a text with a replacement value, either every occurrence (default) or only the first match. Use it to rewrite or delete substrings - prefer Find or Find All when you only need to locate matches, and Split when you want the surrounding segments. The search value is always compiled as a regular expression, so regex metacharacters must be escaped, and an empty replacement deletes the matches; deterministic and idempotent.',
    idempotent: true,
  },
  displayName: 'Replace',
  name: 'replace',
  classification: 'READ',
  propertyGroups: [
    {
      key: 'replace',
      display: 'section',
      label: 'Find and replace',
      icon: 'type',
      props: ['text', 'searchValue', 'replaceValue', 'replaceOnlyFirst'],
    },
  ],
  props: {
    text: Property.ShortText({
      displayName: 'Text',
      required: true,
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description:
        'Read as a regular expression: symbols like . * ( need a \\ before them.',
      placeholder: 'e.g. colour',
      required: true,
      width: 'half',
    }),
    replaceValue: Property.ShortText({
      displayName: 'Replace Value',
      required: false,
      description: 'Leave empty to delete each match.',
      width: 'half',
    }),
    replaceOnlyFirst: Property.Checkbox({
      displayName: 'Replace Only First Match',
      required: false,
      description: 'When off, every match is replaced.',
      defaultValue: false,
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
