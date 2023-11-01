import axios from 'axios';
import {
  createAction,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';

export const addNoteToSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'add_note_to_subscriber',
  displayName: 'Add Note to Subscriber',
  description: 'Add a note to a subscriber',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email of the subscriber',
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Note to add to the subscriber',
      required: true,
      validators: [Validators.maxLength(1000)],
    }),
  },
  async run(context) {
    const { list_id, email, note } = context.propsValue;
    const { access_token } = context.auth;

    const subscriberHash = mailchimpCommon.getMD5EmailHash(email);
    const serverPrefix = mailchimpCommon.getMailChimpServerPrefix(access_token);
    const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${list_id}/members/${subscriberHash}/notes`;

    try {
      const response = await axios.post(
        url,
        { note },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      return error;
    }
  },
});
