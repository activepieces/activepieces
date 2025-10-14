import { createAction, Property } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { googleChatApiAuth, googleChatCommon } from '../common';
import { allSpacesDropdown, spacesDropdown, peoplesDropdown, threadsDropdown } from '../common/props';
import { googleChatAPIService } from '../common/requests';

export const sendAMessage = createAction({
  auth: googleChatApiAuth,
  name: 'sendAMessage',
  displayName: 'Send a Message',
  description: 'Send a message to a space or direct conversation.',
  props: {
    spaceId: allSpacesDropdown({ refreshers: ['auth'], required: true }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'The message content to send. Supports basic formatting like *bold*, _italic_, and @mentions.',
      required: true,
    }),
    thread: threadsDropdown({ refreshers: ['auth', 'spaceId'], required: false }),
    messageReplyOption: Property.StaticDropdown({
      displayName: 'Reply Behavior',
      description: 'How to handle replies when thread ID is provided.',
      required: false,
      options: {
        options: [
          {
            label: 'Reply or start new thread',
            value: 'REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD',
          },
          {
            label: 'Reply only (fail if thread not found)',
            value: 'REPLY_MESSAGE_OR_FAIL',
          },
        ],
      },
    }),
    customMessageId: Property.ShortText({
      displayName: 'Custom Message ID',
      description: 'Optional unique ID for this message (auto-generated if empty). Useful for deduplication.',
      required: false,
    }),
    isPrivate: Property.Checkbox({
      displayName: 'Send as Private Message',
      description: 'Send this message privately to a specific user. Requires app authentication.',
      required: false,
    }),
    privateMessageViewer: Property.Dropdown({
      displayName: 'Private Message Recipient',
      description: 'Select the user who can view this private message.',
      required: false,
      refreshers: ['auth'],
      async options({ auth }: any) {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Google account first',
            options: [],
          };
        }

        try {
          const members = await googleChatAPIService.fetchPeople(
            auth.access_token
          );

          return {
            options: members
              .map((member: any) => {
                const nameObj =
                  member.names?.find((n: any) => n.metadata.primary) ||
                  member.names?.[0];
                if (!nameObj) return null;

                return {
                  label: nameObj.displayName,
                  value: member.resourceName,
                };
              })
              .filter(Boolean),
          };
        } catch (e) {
          console.error('Failed to fetch people', e);
          return {
            options: [],
            placeholder: 'Unable to load people',
          };
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, googleChatCommon.sendMessageSchema);

    const { spaceId, text, thread, messageReplyOption, customMessageId, isPrivate, privateMessageViewer } = propsValue;

    const response = await googleChatAPIService.sendMessage({
      accessToken: auth.access_token,
      spaceId: spaceId as string,
      text,
      thread,
      messageReplyOption,
      customMessageId,
      isPrivate,
      privateMessageViewer,
    });

    return response;
  },
});
