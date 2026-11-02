import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../auth';
import { discourseOps } from '../common/operations';
import { discourseSchemas } from '../common/schemas';

export const sendPrivateMessage = createAction({
  auth: discourseAuth,
  name: 'send_private_message',
  classification: 'WRITE',
  description: 'Send a private message in Discourse',
  audience: 'both',
  aiMetadata: {
    description:
      'Start a new private message conversation with one or more Discourse users (by username) and/or groups (by group name), with a title and Markdown body. Use to message members directly instead of posting publicly; to reply inside an existing message use Reply to Topic with its topic ID. Recipients get a notification and possibly an email. Each call starts a new conversation, so retries duplicate.',
    idempotent: false,
  },
  displayName: 'Send Private Message',
  props: {
    title: Property.ShortText({
      description: 'Title for the PM',
      displayName: 'Message Title',
      required: true,
    }),
    raw: Property.LongText({
      description: 'Content of the message (Markdown)',
      displayName: 'Message Content',
      required: true,
    }),
    target_recipients: Property.Array({
      description: 'Usernames to send the PM to (one or more)',
      displayName: 'Users',
      required: true,
    }),
    target_groups: Property.Array({
      description: 'Optional group names to also send the PM to',
      displayName: 'Groups',
      required: false,
    }),
  },
  outputSchema: discourseSchemas.createdPost,
  async run({ auth, propsValue }) {
    return discourseOps.sendPrivateMessage({
      auth: auth.props,
      title: propsValue.title,
      raw: propsValue.raw,
      recipients: propsValue.target_recipients,
      groups: propsValue.target_groups,
    });
  },
});
