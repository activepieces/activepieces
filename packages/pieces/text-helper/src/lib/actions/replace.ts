import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';

export const replace = createAction({
  description: 'Replace a text with another (Regex or text).',
  displayName: 'Replace',
  name: 'replace',
  props: {
    string: Property.ShortText({
      displayName: 'Text',
      required: true,
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Regex or string.',
      required: true,
      validators: [],
    }),
    replaceValue: Property.ShortText({
      displayName: 'Replace Value',
      required: true,
    }),
  },
  run: async (ctx) => {
    const expression = RegExp(ctx.propsValue.searchValue);
    return ctx.propsValue.string.replace(
      expression,
      ctx.propsValue.replaceValue
    );
  },
});
