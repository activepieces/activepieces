import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../auth';
import { makeClient } from '../common';

export const removeTagFromContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_remove_tag',
  displayName: 'Remove Tags from Contact',
  description: 'Removes tags from an existing contact.',
  audience: 'both',
  aiMetadata: {
    description: 'Removes one or more tags from an existing VBOUT contact identified by email. Use to unlabel or re-segment a contact. Tag names are passed as a comma-separated string; idempotent, since removing already-absent tags yields the same end state.',
    idempotent: true,
  },
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
    const client = makeClient(context.auth.secret_text);
    return await client.removeTagFromContact(email, tagname);
  },
});
