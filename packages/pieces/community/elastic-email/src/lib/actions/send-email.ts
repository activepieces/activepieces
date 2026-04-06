import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { elasticEmailAuth } from '../auth';
import { elasticEmailRequest } from '../common/client';
import {
  BODY_CONTENT_TYPE_OPTIONS,
  ENCODING_OPTIONS,
} from '../common/constants';
import { templateNameProp } from '../common/props';

export const sendEmailAction = createAction({
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send an email to one or more recipients via Elastic Email.',
  auth: elasticEmailAuth,
  props: {
    recipients: Property.Array({
      displayName: 'Recipients',
      description: 'List of recipient email addresses.',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description:
        'Sender email with optional name (e.g. `email@domain.com` or `John Doe <email@domain.com>`).',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line.',
      required: false,
    }),
    bodyContentType: Property.StaticDropdown({
      displayName: 'Body Content Type',
      description: 'Type of body content.',
      required: false,
      options: {
        options: BODY_CONTENT_TYPE_OPTIONS.map((s) => ({ label: s, value: s })),
      },
    }),
    bodyContent: Property.LongText({
      displayName: 'Body Content',
      description: 'The actual body content of the email.',
      required: false,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply To',
      description: 'Reply-to email address.',
      required: false,
    }),
    templateName: templateNameProp,
    merge: Property.Object({
      displayName: 'Merge Fields',
      description:
        'Key-value merge fields shared between recipients. Use in email body like {firstname}, {lastname}.',
      required: false,
    }),
    timeOffset: Property.Number({
      displayName: 'Time Offset (minutes)',
      description:
        'Delay sending by this many minutes. Maximum is 35 days (50400 minutes).',
      required: false,
    }),
    poolName: Property.ShortText({
      displayName: 'Pool Name',
      description: 'Name of custom IP pool for sending.',
      required: false,
    }),
    channelName: Property.ShortText({
      displayName: 'Channel Name',
      description: 'Name of the sending channel.',
      required: false,
    }),
    encoding: Property.StaticDropdown({
      displayName: 'Encoding',
      description: 'Encoding type for email headers.',
      required: false,
      options: {
        options: ENCODING_OPTIONS.map((s) => ({ label: s, value: s })),
      },
    }),
    trackOpens: Property.Checkbox({
      displayName: 'Track Opens',
      description:
        'Track email opens. If not set, uses account default.',
      required: false,
    }),
    trackClicks: Property.Checkbox({
      displayName: 'Track Clicks',
      description:
        'Track link clicks. If not set, uses account default.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const recipientEmails = (propsValue.recipients ?? []).map(String);

    return elasticEmailRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/emails',
      body: {
        Recipients: recipientEmails.map((email) => ({ Email: email })),
        Content: {
          From: propsValue.from,
          Subject: propsValue.subject ?? undefined,
          Body:
            (propsValue.bodyContentType || propsValue.bodyContent)
              ? [
                  {
                    ContentType: propsValue.bodyContentType || 'HTML',
                    Body: propsValue.bodyContent,
                  },
                ]
              : undefined,
          ReplyTo: propsValue.replyTo ?? undefined,
          TemplateName: propsValue.templateName ?? undefined,
          Merge: propsValue.merge ?? undefined,
        },
        Options: {
          TimeOffset: propsValue.timeOffset ?? undefined,
          PoolName: propsValue.poolName ?? undefined,
          ChannelName: propsValue.channelName ?? undefined,
          Encoding: propsValue.encoding ?? undefined,
          TrackOpens: propsValue.trackOpens ?? undefined,
          TrackClicks: propsValue.trackClicks ?? undefined,
        },
      },
    });
  },
});
