import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
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
    info: Property.MarkDown({
      value: "Sent with your connection's App Token, so it appears under that token's Gotify app.",
      variant: MarkdownVariant.INFO,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      placeholder: 'Backup finished',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Plain text, or Markdown when Render as Markdown is on.',
      placeholder: 'The nightly backup completed in 4 minutes.',
      required: true,
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description: "0 (lowest) to 10 (highest). Empty uses the app's default.",
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
      description: 'Full http(s) link opened when the notification is tapped.',
      placeholder: 'https://example.com/report',
      required: false,
      advanced: true,
    }),
    big_image_url: Property.ShortText({
      displayName: 'Big Image URL',
      description: 'Full http(s) image URL shown in the expanded Android notification.',
      placeholder: 'https://example.com/image.png',
      required: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['info', 'title', 'message', 'markdown', 'priority'],
    },
  ],
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
