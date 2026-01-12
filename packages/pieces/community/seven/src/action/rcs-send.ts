import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sevenAuth } from '../index';
import { callSevenApi } from '../common';

export const sendRcsAction = createAction({
  auth: sevenAuth,
  name: 'send-rcs',
  displayName: 'Send RCS',
  description: 'Sends a Rich Communication Services message.',
  props: {
    to: Property.ShortText({
      displayName: 'To',
      description: 'Recipient phone number for the RCS message (e.g., 49176123456789).',
      required: true
    }),
    text: Property.LongText({
      displayName: 'Message Body',
      description: 'The body of the message to send.',
      required: true
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'The unique ID of your RCS agent. If not specified, the first RCS-capable sender will be used.',
      required: false
    }),
    delay: Property.DateTime({
      displayName: 'Delay',
      description: 'Date/time for delayed dispatch. Format: yyyy-mm-dd hh:ii or Unix timestamp.',
      required: false
    }),
    fallback: Property.StaticDropdown({
      displayName: 'Fallback',
      description: 'Alternative channel if RCS is not available. If not specified, fallback is disabled.',
      required: false,
      options: {
        options: [
          { label: 'SMS', value: 'sms' },
          { label: 'Webview', value: 'webview' }
        ]
      }
    }),
    ttl: Property.Number({
      displayName: 'TTL (Time to Live)',
      description: 'Validity period of the RCS in minutes. Default is 2880 (48 hours).',
      required: false
    }),
    label: Property.ShortText({
      displayName: 'Label',
      description: 'Label for statistics tracking. Max 100 characters (a-z, A-Z, 0-9, .-_@).',
      required: false
    }),
    performance_tracking: Property.Checkbox({
      displayName: 'Performance Tracking',
      description: 'Activate click and performance tracking for URLs (also enables URL shortener).',
      required: false
    }),
    foreign_id: Property.ShortText({
      displayName: 'Foreign ID',
      description: 'Your own ID for this message (used in callbacks). Max 64 characters (a-z, A-Z, 0-9, .-_@).',
      required: false
    }),
  },
  async run(context) {
    const { 
      to, 
      text, 
      from, 
      delay, 
      fallback, 
      ttl, 
      label, 
      performance_tracking, 
      foreign_id 
    } = context.propsValue;

    const response = await callSevenApi({
      body: {
        to,
        text,
        from,
        delay: delay ? new Date(delay).toISOString().replace('T', ' ').substring(0, 19) : undefined,
        fallback,
        ttl,
        label,
        performance_tracking,
        foreign_id
      },
      method: HttpMethod.POST
    }, 'rcs/messages', context.auth.secret_text);

    return response.body;
  }
});
