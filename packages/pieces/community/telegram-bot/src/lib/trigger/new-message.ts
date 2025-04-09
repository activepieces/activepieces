import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework'
import { telegramBotAuth } from '../..'
import { telegramCommons } from '../common'

export const telegramNewMessage = createTrigger({
  auth: telegramBotAuth,
  name: 'new_telegram_message',
  displayName: 'New message',
  description: 'Triggers when Telegram receives a new message',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    body: {
      message: {
        chat: {
          id: 55169542059,
          type: 'private',
          username: 'AbdallahAlwarawreh',
          last_name: 'Alwarawreh',
          first_name: 'Abdallah',
        },
        date: 1686050152,
        from: {
          id: 55169542059,
          is_bot: false,
          username: 'AbdallahAlwarawreh',
          last_name: 'Alwarawreh',
          first_name: 'Abdallah',
          language_code: 'en',
        },
        parse_mode: 'MarkdownV2',
        text: 'Hello world',
        message_id: 21,
      },
      update_id: 351114420,
    },
  },
  async onEnable(context) {
    await telegramCommons.subscribeWebhook(context.auth, context.webhookUrl, {
      allowed_updates: [],
    })
  },
  async onDisable(context) {
    await telegramCommons.unsubscribeWebhook(context.auth)
  },
  async run(context) {
    return [context.payload.body]
  },
  async test(context) {
    const messages = await getLastFiveMessages(context.auth)
    return messages.result
  },
})

const getLastFiveMessages = async (botToken: string) => {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `https://api.telegram.org/bot${botToken}/getUpdates?offset=-5`,
  }
  const response = await httpClient.sendRequest(request)
  return response.body
}
