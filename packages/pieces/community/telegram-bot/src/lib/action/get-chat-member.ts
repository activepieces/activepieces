import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { telegramBotAuth } from '../..';
import { telegramCommons } from '../common';
import { getChatMemberActionOutputSchema } from '../output-schemas';

export const telegramGetChatMemberAction = createAction({
  auth: telegramBotAuth,
  name: 'get_chat_member',
  classification: 'READ',
  description: "Get a person's status and permissions in a chat.",
  audience: 'human',
  aiMetadata: { description: 'Looks up a specific user\'s membership in a chat by chat_id and user_id, returning their role and status (member, administrator, left, kicked, etc.). Use to check whether a user belongs to a chat or what permissions they hold before acting. Idempotent: read-only lookup with no side effects.', idempotent: true },
  displayName: 'Get Chat Member',
  props: {
    instructions: telegramCommons.form.chatIdInstructions(),
    chat_id: telegramCommons.form.chatIdProp(),
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'Numeric user ID, found in the trigger as message.from.id.',
      placeholder: '123456789',
      required: true,
    }),
  },
  outputSchema: getChatMemberActionOutputSchema,
  async run(ctx) {
    const response = await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'getChatMember'),
      body: {
        chat_id: ctx.propsValue.chat_id,
        user_id: ctx.propsValue.user_id,
      },
    });
    return response.body;
  },
});
