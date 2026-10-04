import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';
import { sendLocationActionOutputSchema } from '../output-schemas';

export const telegramSendLocationAction = createAction({
  auth: telegramBotAuth,
  name: 'send_location',
  classification: 'WRITE',
  displayName: 'Send Location',
  description: 'Send a map pin, or a live location that updates, to a chat.',
  audience: 'human',
  aiMetadata: { description: 'Sends a point location given as latitude and longitude to a Telegram chat, optionally as a live location that updates for a set period. Use to share a place or track a moving position; both coordinates are required. Not idempotent: each call posts a new location message.', idempotent: false },
  propertyGroups: [
    { key: 'send_to', display: 'section', label: 'Send to', icon: 'send', props: ['instructions', 'chat_id'] },
    {
      key: 'location',
      display: 'section',
      label: 'Location',
      icon: 'blank',
      props: ['latitude', 'longitude', 'horizontal_accuracy'],
    },
    {
      key: 'live',
      display: 'section',
      label: 'Live Location',
      icon: 'sliders',
      props: ['live_info', 'live_period', 'heading', 'proximity_alert_radius'],
    },
  ],
  props: {
    instructions: telegramCommons.form.chatIdInstructions(),
    chat_id: telegramCommons.form.chatIdProp(),
    latitude: Property.Number({
      displayName: 'Latitude',
      description: 'Between -90 and 90.',
      required: true,
      width: 'half',
    }),
    longitude: Property.Number({
      displayName: 'Longitude',
      description: 'Between -180 and 180.',
      required: true,
      width: 'half',
    }),
    horizontal_accuracy: Property.Number({
      displayName: 'Horizontal Accuracy',
      description: 'Uncertainty radius in meters, 0 to 1500.',
      required: false,
    }),
    live_info: Property.MarkDown({
      value: 'Fill Live Period to share a live location. Heading and Proximity Alert Radius only work with it.',
      variant: MarkdownVariant.INFO,
    }),
    live_period: Property.Number({
      displayName: 'Live Period',
      description: 'Seconds, 60 to 86400.',
      required: false,
      width: 'half',
    }),
    heading: Property.Number({
      displayName: 'Heading',
      description: 'Degrees, 1 to 360.',
      required: false,
      width: 'half',
    }),
    proximity_alert_radius: Property.Number({
      displayName: 'Proximity Alert Radius',
      description: 'Alert distance in meters, 1 to 100000.',
      required: false,
    }),
    message_thread_id: telegramCommons.form.messageThreadIdProp(),
    disable_notification: telegramCommons.form.disableNotificationProp(),
    protect_content: telegramCommons.form.protectContentProp(),
    reply_to_message_id: telegramCommons.form.replyToMessageIdProp(),
    reply_markup: telegramCommons.form.replyMarkupProp(),
  },
  outputSchema: sendLocationActionOutputSchema,
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
