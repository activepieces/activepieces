import { Property, createAction } from '@activepieces/pieces-framework';

export const concat = createAction({
  description: 'Concatenate two or more texts',
  displayName: 'Concatenate',
  name: 'concat',
  props: {
    texts: Property.Array({
      displayName: 'Texts',
      required: true,
    }),
    seperator: Property.ShortText({
      displayName: 'Seperator',
      description: 'String to join each string with.',
      required: false,
    }),
  },
  run: async (ctx) => {
    return ctx.propsValue.texts.join(ctx.propsValue.seperator ?? '');
  },
});
