import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';

export const replace = createAction({
  description: 'Replaces all instances of any word, character or phrase in text, with another.',
  displayName: 'Replace',
  name: 'replace',
  props: {
    text: Property.ShortText({
      displayName: 'Text',
      required: true,
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Can be plain text or a regex expression.',
      required: true,
      validators: [],
    }),
    replaceValue: Property.ShortText({
      displayName: 'Replace Value',
      required: false,
      description:'Leave empty to delete found results.',
    }),
  },
  run: async (ctx) => {
    const expression = RegExp(ctx.propsValue.searchValue,'g');
    return ctx.propsValue.text.replaceAll(
      expression,
      ctx.propsValue.replaceValue || ''
    );
  },
});
