import { createAction, Property } from '@activepieces/pieces-framework';
import { medullarAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getUser, medullarCommon, medullarPropsCommon } from '../common';

export const askSpace = createAction({
  auth: medullarAuth,
  name: 'askSpace',
  displayName: 'Ask Space',
  description: 'Ask anything to a Space',
  props: {
    spaceId: medullarPropsCommon.spaceId,
    chatId: medullarPropsCommon.chatId,
    selectedMode: Property.StaticDropdown({
      displayName: 'Chat Mode',
      description: 'Select chat mode.',
      required: true,
      options: {
        options: [
          {
            label: 'Single AI Agent',
            value: 'single_agent',
          },
          {
            label: 'Basic AI Chat',
            value: 'chat',
          },
        ],
      },
    }),
    isReasoning: Property.Checkbox({
      displayName: 'Deep Analysis',
      description:
        'Optional. Enable Deep Analysis to get more accurate results but slower response time',
      required: false,
      defaultValue: false,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'Message to send to the Space',
      required: true,
    }),
  },
  async run(context) {
    const userData = await getUser(context.auth);
    let chatId = context.propsValue['chatId'];

    if (chatId == null) {
      // if no chatId is selected, create a new one
      const chatResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${medullarCommon.exploratorUrl}/chats/`,
        body: {
          name: 'automated',
          space: {
            uuid: context.propsValue['spaceId'],
          },
        },
        headers: {
          Authorization: `Bearer ${context.auth}`,
        },
      });
      chatId = chatResponse.body.uuid;
    }

    const messageResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${medullarCommon.exploratorUrl}/messages/?chat=${chatId}`,
      body: {
        name: 'automated',
        chat: {
          uuid: chatId,
        },
        text: context.propsValue['text'],
        user_email: userData.email,
        user_uuid: userData.uuid,
        user_name: userData.name,
        is_bot: false,
        is_reasoning_selected: context.propsValue['isReasoning'],
        selected_mode: context.propsValue['selectedMode'],
        source: 'external_api',
      },
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
    });

    return messageResponse.body;
  },
});
