import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { googleChatAuth } from '../..';
// Import the common file and the API URL constant
import { googleChatCommon, GCHAT_API_URL } from '../common';

export const sendMessage = createAction({
  auth: googleChatAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send a message to a space or direct conversation.',
  props: {
    space: googleChatCommon.space, // Use the dynamic dropdown from the common file
    text: Property.LongText({
      displayName: 'Message Text',
      description: 'The plain-text body of the message.',
      required: true,
    }),
    threadKey: Property.ShortText({
      displayName: 'Thread Key',
      description:
        'An ID for the thread. Use this to start a new thread or reply to an existing one.',
      required: false,
    }),
    messageReplyOption: Property.StaticDropdown({
      displayName: 'Message Reply Option',
      description:
        'Specifies whether a message starts a thread or replies to one.',
      required: false,
      options: {
        options: [
          {
            label: 'Start a new thread (Default)',
            value: 'MESSAGE_REPLY_OPTION_UNSPECIFIED',
          },
          {
            label: 'Reply to message or start new thread',
            value: 'REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD',
          },
          {
            label: 'Reply to message or fail',
            value: 'REPLY_MESSAGE_OR_FAIL',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { space, text, threadKey, messageReplyOption } = context.propsValue;

    // Construct the message body
    const messageBody: { text: string; thread?: { threadKey: string } } = {
      text: text,
    };

    if (threadKey) {
      messageBody.thread = {
        threadKey: threadKey,
      };
    }

    // Construct query parameters
    const queryParams: Record<string, string> = {};
    if (messageReplyOption) {
      queryParams['messageReplyOption'] = messageReplyOption;
    }

    // Send the request to the Google Chat API
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      // Use the imported constant for the URL
      url: `${GCHAT_API_URL}/${space}/messages`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      queryParams: queryParams,
      body: messageBody,
    });

    const messageName: string = response.body.name; // e.g. "spaces/AAAA123/messages/ABCD456"
    const messageId = messageName.split('/').pop(); // "ABCD456"

    return {
      ...response.body,
      messageId,
    };
  },
});
