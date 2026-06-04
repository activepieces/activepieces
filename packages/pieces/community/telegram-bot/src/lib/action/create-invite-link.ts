import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { telegramBotAuth } from '../..';
import { telegramCommons } from '../common';

export const telegramCreateInviteLinkAction = createAction({
  auth: telegramBotAuth,
  name: 'create_invite_link',
  description: 'Create an invite link for a chat',
  displayName: 'Create Invite Link',
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the invite link (max 32 chars)',
      required: false,
    }),
    expire_date: Property.DateTime({
      displayName: 'Expire Date',
      description: 'Point in time when the link will expire',
      required: false,
    }),
    member_limit: Property.Number({
      displayName: 'Member Limit',
      description:
        'Maximum number of users that can be members of the chat simultaneously after joining the chat via this invite link; 1-99999',
      required: false,
    }),
    creates_join_request: Property.Checkbox({
      displayName: 'Creates Join Request',
      description:
        'If True, users joining the chat via the link need to be approved by chat administrators.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(ctx) {
    const response = await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'createChatInviteLink'),
      headers: {},
      body: {
        chat_id: ctx.propsValue.chat_id,
        name: ctx.propsValue.name ?? undefined,
        expire_date: ctx.propsValue.expire_date
          ? Math.floor(new Date(ctx.propsValue.expire_date).getTime() / 1000)
          : undefined,
        member_limit: ctx.propsValue.member_limit ?? undefined,
        creates_join_request: ctx.propsValue.creates_join_request ?? false,
      },
    });
    return response.body;
  },
});
