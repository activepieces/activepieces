import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { pastefyAuth } from '../..';

export default createAction({
  auth: pastefyAuth,
  name: 'delete_paste',
  displayName: 'Delete Paste',
  description: 'Deletes a paste',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a paste by its ID from a Pastefy instance. Use to remove a snippet you no longer want hosted. Keyed on the stable paste ID, so the end state (paste absent) is the same on repeat calls; idempotent.', idempotent: true },
  props: {
    paste_id: Property.ShortText({
      displayName: 'Paste ID',
      required: true,
    }),
  },
  async run(context) {
    const client = makeClient(context.auth, context.propsValue);
    const res = await client.deletePaste(context.propsValue.paste_id);
    return res;
  },
});
