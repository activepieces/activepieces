import { createAction, Property } from '@activepieces/pieces-framework';
import { linkupAuth, linkupAction, accountIdProp } from '../common';

export const sendMessage = createAction({
  auth: linkupAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send a LinkedIn message to a profile, optionally with a media attachment.',
  audience: 'both',
  aiMetadata: { description: 'Sends a LinkedIn direct message from the connected account to a recipient profile URL, optionally attaching a media link. Use it for outreach or replies to an existing thread; Send Connection Request is the right action when the recipient cannot be messaged yet, and Get Conversation loads the thread context first. Requires the account ID, the recipient profile URL, and message text. Not idempotent: every call delivers another message, so retries duplicate it.', idempotent: false },
  props: {
    accountId: accountIdProp,
    profileUrl: Property.ShortText({
      displayName: 'Profile URL',
      description: 'LinkedIn profile URL of the recipient',
      required: true,
    }),
    messageText: Property.LongText({
      displayName: 'Message',
      description: 'The text of the message to send',
      required: true,
    }),
    mediaLink: Property.ShortText({
      displayName: 'Media Link',
      description: 'Optional URL of a media file to attach',
      required: false,
    }),
  },
  async run(context) {
    const { accountId, profileUrl, messageText, mediaLink } = context.propsValue;
    return linkupAction(context.auth.secret_text, 'messages', 'send', accountId, {
      profile_url: profileUrl,
      message_text: messageText,
      media_link: mediaLink,
    });
  },
});
