import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { buildMessageBody, pushoverApiCall } from '../common';
import { sendPushMessageOutputSchema } from '../output-schemas';

export const sendPushMessage = createAction({
  auth: pushoverAuth,
  name: 'send_push_message',
  classification: 'WRITE',
  displayName: 'Send Push Message',
  description: 'Send a push message through Pushover with the full parameter set',
  audience: 'ai',
  aiMetadata: {
    description:
      'Send a push notification to the user or group key on the connection, exposing every Pushover message parameter (sound, ttl, tags, attachment, monospace, callback). Emergency priority 2 requires both retry (>= 30 seconds) and expire (<= 10800 seconds), is capped at 50 total retries regardless of expire (retry=30 with expire=10800 therefore stops after about 25 minutes), ignores ttl, and is the only priority that returns a receipt for Get Emergency Receipt Status and the cancel actions. Not idempotent: every call delivers a new notification.',
    idempotent: false,
  },
  props: {
    message: Property.LongText({
      displayName: 'Message',
      description: 'Body of the notification. Required.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description:
        'Title shown above the message. Defaults to the application name when omitted.',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description:
        'Delivery urgency. 2 (emergency) additionally requires Retry and Expire, ignores Time To Live, and returns a receipt.',
      required: false,
      options: {
        options: [
          { label: 'Lowest (-2, no notification)', value: -2 },
          { label: 'Low (-1, no sound or vibration)', value: -1 },
          { label: 'Normal (0)', value: 0 },
          { label: 'High (1, bypasses quiet hours)', value: 1 },
          { label: 'Emergency (2, repeats until acknowledged)', value: 2 },
        ],
      },
    }),
    retry: Property.Number({
      displayName: 'Retry',
      description:
        'Emergency priority only. Seconds between repeat deliveries, minimum 30. Pushover stops after 50 retries even if Expire has not elapsed.',
      required: false,
    }),
    expire: Property.Number({
      displayName: 'Expire',
      description:
        'Emergency priority only. Seconds to keep retrying for, maximum 10800.',
      required: false,
    }),
    ttl: Property.Number({
      displayName: 'Time To Live',
      description:
        'Seconds after which the notification is auto-deleted from the device. Ignored at emergency priority (2).',
      required: false,
    }),
    sound: Property.Dropdown({
      displayName: 'Sound',
      description:
        'Notification sound. Leave on the default option to omit the parameter so the recipient device sound applies.',
      required: false,
      auth: pushoverAuth,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect a Pushover account first',
            options: [],
          };
        }
        const response = await pushoverApiCall<{
          sounds: Record<string, string>;
        }>({
          method: HttpMethod.GET,
          resourceUri: '/sounds.json',
          queryParams: { token: auth.props.api_token },
        });
        return {
          disabled: false,
          options: [
            { label: "Device default (don't send a sound)", value: '' },
            ...Object.entries(response.sounds ?? {}).map(
              ([value, label]) => ({ label, value })
            ),
          ],
        };
      },
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description:
        "Supplementary URL shown with the message, for example 'https://status.example.com/incident/42'.",
      required: false,
    }),
    url_title: Property.ShortText({
      displayName: 'URL Title',
      description:
        'Link text for the supplementary URL. The raw URL is shown when omitted.',
      required: false,
    }),
    device: Property.ShortText({
      displayName: 'Device',
      description:
        "Deliver only to this device name, for example 'iphone'. All devices receive it when omitted.",
      required: false,
    }),
    timestamp: Property.ShortText({
      displayName: 'Timestamp',
      description:
        "Unix timestamp to display instead of the receive time, for example '1767225600'.",
      required: false,
    }),
    html: Property.Checkbox({
      displayName: 'Enable HTML',
      description:
        'Parse a limited HTML subset in the message. Cannot be combined with Monospace.',
      required: false,
    }),
    monospace: Property.Checkbox({
      displayName: 'Monospace',
      description:
        'Render the message in a monospace font. Cannot be combined with Enable HTML.',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description:
        "Comma-separated tags stored with an emergency notification, for example 'deploy,prod'. Required upfront if you intend to use Cancel Emergency Retries by Tag.",
      required: false,
    }),
    callback: Property.ShortText({
      displayName: 'Callback URL',
      description:
        'Emergency priority only. Pushover POSTs to this URL once the notification is acknowledged.',
      required: false,
    }),
    attachment_base64: Property.LongText({
      displayName: 'Attachment (Base64)',
      description:
        'Base64-encoded image to attach, maximum 5242880 bytes decoded. Requires Attachment Type.',
      required: false,
    }),
    attachment_type: Property.ShortText({
      displayName: 'Attachment Type',
      description:
        "MIME type of the attachment, for example 'image/jpeg'. Required when an attachment is supplied.",
      required: false,
    }),
  },
  outputSchema: sendPushMessageOutputSchema,
  async run({ auth, propsValue }) {
    const body = buildMessageBody({
      apiToken: auth.props.api_token,
      userKey: auth.props.user_key,
      message: propsValue.message,
      title: propsValue.title,
      html: propsValue.html,
      monospace: propsValue.monospace,
      priority: propsValue.priority,
      retry: propsValue.retry,
      expire: propsValue.expire,
      ttl: propsValue.ttl,
      url: propsValue.url,
      urlTitle: propsValue.url_title,
      timestamp: propsValue.timestamp,
      device: propsValue.device,
      sound: propsValue.sound,
      tags: propsValue.tags,
      callback: propsValue.callback,
      attachmentBase64: propsValue.attachment_base64,
      attachmentType: propsValue.attachment_type,
    });

    return await pushoverApiCall({
      method: HttpMethod.POST,
      resourceUri: '/messages.json',
      body,
    });
  },
});
