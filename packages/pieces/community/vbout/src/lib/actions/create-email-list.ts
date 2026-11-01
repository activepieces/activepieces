import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../auth';
import { makeClient } from '../common';

export const createEmailListAction = createAction({
  auth: vboutAuth,
  name: 'vbout_create_email_list',
  classification: 'WRITE',
  displayName: 'Create Email List',
  description: 'Creates a new email list.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a new VBOUT email list with optional subscription settings (sender, reply-to, confirmation and notification emails/messages). Use to set up a new audience before adding contacts or sending campaigns. Only the list name is required; not idempotent, as each call creates a new list.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      required: true,
      displayName: 'Name',
    }),
    email_subject: Property.LongText({
      required: false,
      displayName: 'Email Subject',
      description: "Default subject of this list's subscription emails.",
    }),
    reply_to: Property.ShortText({
      required: false,
      displayName: 'Reply To',
      placeholder: 'support@example.com',
    }),
    fromemail: Property.ShortText({
      required: false,
      displayName: 'From Email',
      placeholder: 'news@acme.com',
      width: 'half',
    }),
    from_name: Property.ShortText({
      required: false,
      displayName: 'From Name',
      placeholder: 'Jane from Acme',
      width: 'half',
    }),
    notify_email: Property.ShortText({
      required: false,
      displayName: 'Notify Email',
      description: 'Receives a notification when someone subscribes.',
      placeholder: 'you@example.com',
    }),
    success_email: Property.ShortText({
      required: false,
      displayName: 'Success Email',
      description: 'Email sent when someone subscribes.',
    }),
    success_message: Property.ShortText({
      required: false,
      displayName: 'Success Message',
      description: 'Shown after someone subscribes.',
    }),
    error_message: Property.ShortText({
      required: false,
      displayName: 'Error Message',
      description: 'Shown when a subscription fails.',
    }),
    confirmation_email: Property.ShortText({
      required: false,
      displayName: 'Confirmation Email',
      description: 'Email asking new subscribers to confirm.',
    }),
    confirmation_message: Property.ShortText({
      required: false,
      displayName: 'Confirmation Message',
      description: 'Shown after someone confirms their subscription.',
    }),
  },
  propertyGroups: [
    { key: 'list', display: 'section', label: 'List', icon: 'users', props: ['name', 'notify_email'] },
    { key: 'sender', display: 'section', label: 'Sender', icon: 'send', props: ['from_name', 'fromemail', 'reply_to', 'email_subject'] },
    {
      key: 'messages',
      display: 'section',
      label: 'Subscription Messages',
      icon: 'inbox',
      props: ['success_email', 'success_message', 'error_message', 'confirmation_email', 'confirmation_message'],
    },
  ],

  async run({ auth, propsValue }) {
    const client = makeClient(auth.secret_text);
    return await client.createEmailList(propsValue);
  },
});
