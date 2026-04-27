import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { moosendAuth } from '../../index';
import { moosendRequest } from '../common/client';

export const unsubscribeMember = createAction({
  name: 'unsubscribe_member',
  displayName: 'Unsubscribe Member',
  description: 'Unsubscribe a member from a mailing list.',
  auth: moosendAuth,
  props: {
    mailingListId: Property.ShortText({
      displayName: 'Mailing List ID',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { mailingListId, email } = propsValue;
    return moosendRequest(auth, HttpMethod.POST, `/subscribers/${mailingListId}/${encodeURIComponent(email)}/unsubscribe.json`);
  },
});
