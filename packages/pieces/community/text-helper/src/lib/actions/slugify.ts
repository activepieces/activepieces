import { Property, createAction } from '@activepieces/pieces-framework'
import slugify from 'slugify'

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
    return slugify(propsValue.text)
  },
})
