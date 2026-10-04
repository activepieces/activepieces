import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { telegramBotAuth } from '../..';
import { telegramCommons } from '../common';
import { createInviteLinkActionOutputSchema } from '../output-schemas';

export const telegramCreateInviteLinkAction = createAction({
  auth: telegramBotAuth,
  name: 'create_invite_link',
  classification: 'WRITE',
  description: 'Create an invite link for a group or channel.',
  audience: 'human',
  aiMetadata: { description: 'Creates a new invite link for a chat by chat_id, optionally with a name, expiry, member limit, or join-request approval. Use to generate a shareable join link; the bot must be an administrator with invite rights. Not idempotent: each call mints a distinct new invite link.', idempotent: false },
  displayName: 'Create Invite Link',
  propertyGroups: [
    { key: 'chat', display: 'section', label: 'Chat', icon: 'users', props: ['instructions', 'chat_id'] },
    { key: 'link', display: 'section', label: 'Link Settings', icon: 'sliders', props: ['name', 'expire_date'] },
    {
      key: 'access',
      display: 'section',
      label: 'Who Can Join',
      icon: 'user',
      props: ['access_info', 'member_limit', 'creates_join_request'],
    },
  ],
  props: {
    instructions: telegramCommons.form.chatIdInstructions(),
    chat_id: telegramCommons.form.chatIdProp(),
    name: Property.ShortText({
      displayName: 'Link Name',
      description: 'Up to 32 characters, shown only to admins.',
      required: false,
      width: 'half',
    }),
    expire_date: Property.DateTime({
      displayName: 'Expiry Date',
      description: 'Empty means the link never expires.',
      required: false,
      width: 'half',
    }),
    access_info: Property.MarkDown({
      value: 'Use a member limit or admin approval, not both.',
      variant: MarkdownVariant.INFO,
    }),
    member_limit: Property.Number({
      displayName: 'Member Limit',
      description: 'How many people can join with this link, 1 to 99999.',
      required: false,
    }),
    creates_join_request: Property.Checkbox({
      displayName: 'Require Admin Approval',
      description: 'Admins approve each person who joins with the link.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: createInviteLinkActionOutputSchema,
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
