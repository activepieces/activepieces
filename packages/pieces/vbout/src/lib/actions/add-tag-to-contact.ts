import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../..';
import { makeClient } from '../common';

export const addTagToContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_add_tag',
  displayName: 'Add Tag to Contact',
  description: 'Adds the tag to the contact.',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      required: true,
    }),
    tagname: Property.Array({
      displayName: 'Tag Name',
      required: true,
    }),
  },
  async run(context) {
    const { email, tagname } = context.propsValue;
    const client = makeClient(context.auth as string);
    return await client.addTagToContact({
      email: email,
      tagname: tagname as string[],
    });
  },
});
