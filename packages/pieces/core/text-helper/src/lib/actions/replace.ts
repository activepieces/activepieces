import { Property, createAction } from '@activepieces/pieces-framework';

export const replace = createAction({
  description:
    'Replaces all instances of any word, character or phrase in text, with another.',
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
