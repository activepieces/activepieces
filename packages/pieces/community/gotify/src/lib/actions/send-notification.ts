import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gotifyAuth } from '../auth';
import { gotifyClient } from '../common/client';
import { gotifyOutputSchemas } from '../common/output-schemas';

export const sendNotification = createAction({
  auth: gotifyAuth,
  name: 'send_notification',
  classification: 'WRITE',
  displayName: 'Send Notification',
  description: 'Send a push notification through your Gotify server.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a push notification (title, message, optional 0-10 priority, optional Markdown rendering, click URL and big image URL) to the self-hosted Gotify server in the connection, using its App Token. Returns the created message with its id. Not idempotent: each call posts a new message, so repeating it delivers a duplicate notification.',
    idempotent: false,
  },
  outputSchema: gotifyOutputSchemas.message,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the notification',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to send',
      required: true,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description: '0 (lowest) to 10. Empty uses the application default.',
      required: false,
    }),
    markdown: Property.Checkbox({
      displayName: 'Render as Markdown',
      description: 'Ask Gotify clients to render the message as Markdown.',
      required: false,
      defaultValue: false,
    }),
    click_url: Property.ShortText({
      displayName: 'Click URL',
      description: 'URL opened when the notification is tapped (http or https).',
      required: false,
    }),
    big_image_url: Property.ShortText({
      displayName: 'Big Image URL',
      description: 'Image shown in the expanded notification on Android (http or https).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const message = typeof propsValue.message === 'string' ? propsValue.message : '';
    if (message.trim() === '') {
      throw new Error('Message is required.');
    }
    const priority = gotifyClient.parseOptionalInt({ value: propsValue.priority, label: 'Priority', min: 0, max: 10 });
    const clickUrl = webUrl({ value: propsValue.click_url, label: 'Click URL' });
    const bigImageUrl = webUrl({ value: propsValue.big_image_url, label: 'Big Image URL' });
    const extras = {
      ...(propsValue.markdown === true ? { 'client::display': { contentType: 'text/markdown' } } : {}),
      ...(clickUrl !== undefined || bigImageUrl !== undefined
        ? {
            'client::notification': {
              ...(clickUrl !== undefined ? { click: { url: clickUrl } } : {}),
              ...(bigImageUrl !== undefined ? { bigImageUrl } : {}),
            },
          }
        : {}),
    };
    return gotifyClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/message',
      tokenKind: 'app',
      body: {
        title: propsValue.title,
        message,
        ...(priority !== undefined ? { priority } : {}),
        ...(Object.keys(extras).length > 0 ? { extras } : {}),
      },
    });
  },
});

function webUrl({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = gotifyClient.optionalText(value);
  if (text === undefined) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    throw new Error(`${label} must be a full http or https URL.`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${label} must be a full http or https URL.`);
  }
  return text;
}
