import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../..';
import { makeClient } from '../common';

export const createEmailListAction = createAction({
  auth: vboutAuth,
  name: 'vbout_create_email_list',
  displayName: 'Create Email List',
  description: 'Creates a new email list.',
  props: {
    name: Property.ShortText({
      required: true,
      displayName: 'Name',
      description: 'The name of the list.',
    }),
    email_subject: Property.LongText({
      required: false,
      displayName: 'Email Subject',
      description: 'The default subscription subject.',
    }),
    reply_to: Property.ShortText({
      required: false,
      displayName: 'Reply To',
      description: 'The Reply to email of the list.',
    }),
    fromemail: Property.ShortText({
      required: false,
      displayName: 'From Email',
      description: 'The From email of the list.',
    }),
    from_name: Property.ShortText({
      required: false,
      displayName: 'From Name',
      description: 'The From name of the list.',
    }),
    notify_email: Property.ShortText({
      required: false,
      displayName: 'Notify Email',
      description: 'Notification Email.',
    }),
    success_email: Property.ShortText({
      required: false,
      displayName: 'Success Email',
      description: 'Subscription Success Email.',
    }),
    success_message: Property.ShortText({
      required: false,
      displayName: 'Success Message',
      description: 'Subscription Success Message.',
    }),
    error_message: Property.ShortText({
      required: false,
      displayName: 'Error Message',
      description: 'Subscription Error Message.',
    }),
    confirmation_email: Property.ShortText({
      required: false,
      displayName: 'Confirmation Email',
      description: 'Confirmation Email Message.',
    }),
    confirmation_message: Property.ShortText({
      required: false,
      displayName: 'Confirmation Message',
    }),
  },

  async run({ auth, propsValue }) {
    const client = makeClient(auth as string);
    return await client.createEmailList(propsValue);
  },
});
