import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../..';
import { makeClient } from '../common';

export const removeTagFromContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_remove_tag',
  displayName: 'Remove Tags from Contact',
  description: 'Removes tags from an existing contact.',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      required: true,
    }),
    tagname: Property.ShortText({
      displayName: 'Tag Name',
      required: true,
      description: `use comma for multiple tag e.g. **tag1,tag2**.`,
    }),
  },
  async run(context) {
    const { email, tagname } = context.propsValue;
    const client = makeClient(context.auth as string);
    return await client.removeTagFromContact(email, tagname);
  },
});
