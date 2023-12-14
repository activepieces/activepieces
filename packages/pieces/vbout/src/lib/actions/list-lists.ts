import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { vboutAuth } from '../..';

export const vboutListContactListAction = createAction({
  auth: vboutAuth,
  name: 'vbout_add_contact',
  displayName: 'Add Contact to List',
  description: 'Adds a contact to specific email list.',
  props: {},
  async run({ auth }) {
    const client = makeClient(auth as string);
    return await client.listContactLists();
  },
});
