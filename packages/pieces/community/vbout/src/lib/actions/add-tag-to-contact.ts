import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../auth';
import { makeClient } from '../common';

export const addTagToContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_add_tag',
  displayName: 'Add Tag to Contact',
  description: 'Adds the tag to the contact.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds one or more tags to an existing VBOUT contact identified by email. Use to label or segment a contact. Accepts a list of tag names; not idempotent, as it appends tags on each call.',
    idempotent: false,
  },
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
    const client = makeClient(context.auth.secret_text);
    return await client.addTagToContact({
      email: email,
      tagname: tagname as string[],
    });
  },
});
