import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramAnswerCallbackQueryAction = createAction({
  auth: telegramBotAuth,
  name: 'answer_callback_query',
  classification: 'WRITE',
  displayName: 'Answer Callback Query',
  description: 'Answer a tap on an inline button with a short banner or alert.',
  audience: 'human',
  aiMetadata: { description: 'Acknowledges a callback query raised when a user taps an inline keyboard button, identified by callback_query_id (from the trigger payload), optionally showing a toast or alert. Use to stop the button spinner and give feedback; a given query can only be answered once. Not idempotent: each call is a one-time response to that query.', idempotent: false },
  propertyGroups: [
    { key: 'callback', display: 'section', label: 'Button Tap', icon: 'reply', props: ['callback_query_id'] },
    { key: 'response', display: 'section', label: 'Response', icon: 'text', props: ['text', 'show_alert'] },
  ],
  props: {
    callback_query_id: Property.ShortText({
      displayName: 'Callback Query ID',
      description: 'callback_query.id from the New Update trigger.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'Up to 200 characters. Empty just stops the loading spinner.',
      required: false,
    }),
    show_alert: Property.Checkbox({
      displayName: 'Show Alert',
      description: 'Show a pop-up the user must close, instead of a banner.',
      required: false,
      defaultValue: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Only a t.me link to your bot, or a game URL.',
      required: false,
      advanced: true,
    }),
    cache_time: Property.Number({
      displayName: 'Cache Time',
      description: 'Seconds Telegram may reuse this answer. Default 0.',
      required: false,
      advanced: true,
    }),
  },
  async run(ctx) {
    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'answerCallbackQuery'),
      body: {
        callback_query_id: ctx.propsValue.callback_query_id,
        text: ctx.propsValue.text ?? undefined,
        show_alert: ctx.propsValue.show_alert ?? false,
        url: ctx.propsValue.url ?? undefined,
        cache_time: ctx.propsValue.cache_time ?? undefined,
      },
    });
  },
});
