import slugify from 'slugify';
import { Property, createAction } from '@activepieces/pieces-framework';

export const slugifyAction = createAction({
  audience: 'human',
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
