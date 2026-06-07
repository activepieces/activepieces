import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramSendLocationAction = createAction({
  auth: telegramBotAuth,
  name: 'send_location',
  displayName: 'Send Location',
  description: 'Send a geographic location (latitude/longitude) to a Telegram chat',
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    message_thread_id: telegramCommons.messageThreadIdProp(),
    latitude: Property.Number({
      displayName: 'Latitude',
      description: 'Latitude of the location.',
      required: true,
    }),
    longitude: Property.Number({
      displayName: 'Longitude',
      description: 'Longitude of the location.',
      required: true,
    }),
    horizontal_accuracy: Property.Number({
      displayName: 'Horizontal Accuracy',
      description: 'Radius of uncertainty for the location, in meters (0–1500).',
      required: false,
    }),
    live_period: Property.Number({
      displayName: 'Live Period',
      description:
        'Number of seconds the location will be updated (60–86400). Use for live locations.',
      required: false,
    }),
    heading: Property.Number({
      displayName: 'Heading',
      description: 'For live locations, direction the user is moving in degrees (1–360).',
      required: false,
    }),
    proximity_alert_radius: Property.Number({
      displayName: 'Proximity Alert Radius',
      description:
        'For live locations, the max distance (1–100000 m) for proximity alerts about approaching another chat member.',
      required: false,
    }),
    disable_notification: telegramCommons.disableNotificationProp(),
    protect_content: telegramCommons.protectContentProp(),
    reply_to_message_id: telegramCommons.replyToMessageIdProp(),
    reply_markup: telegramCommons.replyMarkupProp(),
  },
  async run(ctx) {
    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'sendLocation'),
      body: {
        chat_id: ctx.propsValue.chat_id,
        latitude: ctx.propsValue.latitude,
        longitude: ctx.propsValue.longitude,
        message_thread_id: ctx.propsValue.message_thread_id ?? undefined,
        horizontal_accuracy: ctx.propsValue.horizontal_accuracy ?? undefined,
        live_period: ctx.propsValue.live_period ?? undefined,
        heading: ctx.propsValue.heading ?? undefined,
        proximity_alert_radius: ctx.propsValue.proximity_alert_radius ?? undefined,
        disable_notification: ctx.propsValue.disable_notification ?? false,
        protect_content: ctx.propsValue.protect_content ?? false,
        reply_to_message_id: ctx.propsValue.reply_to_message_id ?? undefined,
        reply_markup: ctx.propsValue.reply_markup ?? undefined,
      },
    });
  },
});
