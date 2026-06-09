import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramAnswerCallbackQueryAction = createAction({
  auth: telegramBotAuth,
  name: 'answer_callback_query',
  displayName: 'Answer Callback Query',
  description:
    'Respond to a callback query sent by an inline keyboard button. Shows a notification or alert to the user.',
  audience: 'both',
  aiMetadata: { description: 'Acknowledges a callback query raised when a user taps an inline keyboard button, identified by callback_query_id (from the trigger payload), optionally showing a toast or alert. Use to stop the button spinner and give feedback; a given query can only be answered once. Not idempotent: each call is a one-time response to that query.', idempotent: false },
  props: {
    callback_query_id: Property.ShortText({
      displayName: 'Callback Query Id',
      description:
        'Unique identifier of the callback query. Available on `callback_query.id` in the New Callback Query trigger payload.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description:
        'Text shown to the user. If not specified, nothing is shown (the spinner is just stopped).',
      required: false,
    }),
    show_alert: Property.Checkbox({
      displayName: 'Show Alert',
      description: 'If True, an alert dialog is shown instead of a notification at the top of the screen.',
      required: false,
      defaultValue: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'URL that will be opened by the user.',
      required: false,
    }),
    cache_time: Property.Number({
      displayName: 'Cache Time (seconds)',
      description:
        'The maximum amount of time in seconds the result of the callback query may be cached client-side.',
      required: false,
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
