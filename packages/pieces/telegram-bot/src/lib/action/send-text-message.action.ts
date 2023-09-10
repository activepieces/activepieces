import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { telegramCommons } from "../common";
import { telegramBotAuth } from "../..";

const chatId = `

**How to obtain Chat ID:**
1. Search for the bot "@getmyid_bot" in Telegram.
2. Start a conversation with the bot.
3. Send the command "/my_id" to the bot.
4. The bot will reply with your chat ID.

**Note: Remember to initiate the chat with the bot, or you'll get an error for "chat not found.**
`
export const telegramSendMessageAction = createAction({
    auth: telegramBotAuth,
    name: 'send_text_message',
    description: 'Send a message through a Telegram bot',
    displayName: 'Send Text Message',
    props: {
        instructions: Property.MarkDown({
            value: chatId,
        }),
        chat_id: Property.ShortText({
            displayName: 'Chat Id',
            required: true,
        }),
        message_thread_id: Property.ShortText({
            displayName: 'Message Thread Id',
            description: 'Unique identifer for the target message thread of the forums; for forums supergroups only',
            required: false,
        }),
        message: Property.LongText({
            displayName: 'Message',
            description: 'The message to be sent',
            required: true,
        })
    },
    async run(ctx) {
        return await httpClient.sendRequest<never>({
            method: HttpMethod.POST,
            url: telegramCommons.getApiUrl(ctx.auth, 'sendMessage'),
            body: {
                chat_id: ctx.propsValue['chat_id'],
                text: ctx.propsValue['message'],
                message_thread_id: ctx.propsValue['message_thread_id'] ?? undefined,
            },
        });
    },
});
