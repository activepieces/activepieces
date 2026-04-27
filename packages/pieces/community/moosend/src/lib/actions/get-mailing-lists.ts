import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { moosendAuth } from '../../index';
import { moosendRequest, MoosendMailingList } from '../common/client';

export const getMailingLists = createAction({
  name: 'get_mailing_lists',
  displayName: 'Get Mailing Lists',
  description: 'Retrieve all mailing lists in your Moosend account.',
  auth: moosendAuth,
  props: {},
  async run({ auth }) {
    return moosendRequest<{ Context: { MailingLists: MoosendMailingList[] } }>(
      auth, HttpMethod.GET, '/lists.json'
    );
  },
});
