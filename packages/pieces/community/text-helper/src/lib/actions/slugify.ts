import slugify from 'slugify';
import { Property, createAction } from '@ensemble/pieces-framework';

export const slugifyAction = createAction({
  description: 'Slugifies strings.',
  displayName: 'Slugify',
  name: 'slugify',
  props: {
    text: Property.ShortText({
      displayName: 'Text',
      required: true,
    }),
  },
  run: async ({ propsValue }) => {
    return slugify(propsValue.text);
  },
});
