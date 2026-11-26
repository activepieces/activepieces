import { Property, createAction } from '@activepieces/pieces-framework';

export const concat = createAction({
  audience: 'both',
  description: 'Join a list of texts into one, with an optional separator.',
  aiMetadata: {
    description:
      'Joins a list of text values into a single string, optionally inserting a separator between each item. Use it to assemble one string from many parts (lines, CSV cells, name fragments); use Split for the reverse. Requires a Texts array - with no separator supplied the values are joined with no gap; deterministic and idempotent.',
    idempotent: true,
  },
  displayName: 'Concatenate',
  name: 'concat',
  classification: 'READ',
  propertyGroups: [
    {
      key: 'join',
      display: 'section',
      label: 'Join texts',
      icon: 'text',
      props: ['texts', 'separator'],
    },
  ],
  props: {
    texts: Property.Array({
      displayName: 'Texts',
      description: 'Each item is added in the order listed.',
      required: true,
    }),
    separator: Property.ShortText({
      displayName: 'Separator',
      description: 'Placed between items. Leave empty to join with no gap.',
      placeholder: ', ',
      required: false,
    }),
  },
  run: async (ctx) => {
    return (ctx.propsValue.texts ?? []).join(ctx.propsValue.separator ?? '');
  },
});
