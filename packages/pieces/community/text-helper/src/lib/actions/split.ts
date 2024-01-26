import { Property, Validators, createAction } from '@activepieces/pieces-framework';

export const split = createAction({
  description: 'Split a text by a delimeter',
  displayName: 'Split',
  name: 'split',
  props: {
    text: Property.ShortText({
      displayName: 'Text',
      required: true,
    }),
    delimeter: Property.ShortText({
      displayName: 'Delimeter',
      required: true,
    }),
  },
  run: async (ctx) => {
    return ctx.propsValue.text.split(ctx.propsValue.delimeter);
  },
});
