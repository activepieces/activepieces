import { createAction } from '@activepieces/pieces-framework';
import { makeClient, vboutCommon } from '../common';
import { vboutAuth } from '../..';

export const vboutGetEmailListAction = createAction({
  auth: vboutAuth,
  name: 'vbout_get_email_list',
  displayName: 'Get List Details with Custom Fields',
  description: 'Retrives specific list details with custom fields.',
  props: {
    listid: vboutCommon.listid(true),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth as string);
    const listId = propsValue.listid!;

    return await client.getEmailList(listId);
  },
});
