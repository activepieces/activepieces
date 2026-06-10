import { createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../auth';
import { makeClient, vboutCommon } from '../common';

export const getEmailListAction = createAction({
  auth: vboutAuth,
  name: 'vbout_get_email_list',
  displayName: 'Get List Details with Custom Fields',
  description: 'Retrieves specific list details with custom fields.',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieves details of a specific VBOUT email list, including its configured custom fields. Use to inspect a list or discover its custom field names before adding or updating contacts. Requires the list ID; this is a read-only lookup and is idempotent.',
    idempotent: true,
  },
  props: {
    listid: vboutCommon.listid(true),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.secret_text);
    const listId = propsValue.listid!;

    return await client.getEmailList(listId);
  },
});
