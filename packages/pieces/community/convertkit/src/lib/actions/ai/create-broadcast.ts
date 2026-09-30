import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { Broadcast } from '../../common/types';
import { kitBroadcastOutputSchema } from '../../output-schemas';

export const kitCreateBroadcast = createAction({
  auth: convertkitAuth,
  name: 'kit_create_broadcast',
  classification: 'WRITE',
  outputSchema: kitBroadcastOutputSchema,
  displayName: 'Create Broadcast',
  description: 'Create a broadcast email, as a draft or scheduled.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a broadcast email. Without Send At it is saved as an unsent draft; setting Send At schedules a real send to the account subscribers at that time, with no segment targeting on this endpoint. Public only publishes it as a web post. Each call creates another broadcast.',
    idempotent: false,
  },
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The email subject line.',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The email body. Plain text or simple HTML (p, h1, img, a).',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Internal Description',
      description: 'An internal note, not shown to subscribers.',
      required: false,
    }),
    email_address: Property.ShortText({
      displayName: 'From Email Address',
      description: 'Sending address. Leave empty to use the account default.',
      required: false,
    }),
    email_layout_template: Property.ShortText({
      displayName: 'Email Template Name',
      description: 'Name of the email template. Leave empty to use the account default.',
      required: false,
    }),
    send_at: Property.DateTime({
      displayName: 'Send At',
      description:
        'When to send, as an ISO 8601 date-time in the future. Leave empty to keep a draft. Setting it schedules a real send.',
      required: false,
    }),
    public: Property.Checkbox({
      displayName: 'Publish As Web Post',
      description: 'Also publish the broadcast on the Creator Profile web page.',
      required: false,
    }),
    published_at: Property.DateTime({
      displayName: 'Published At',
      description: 'Publication time shown on the web post. Only used when publishing as a web post.',
      required: false,
    }),
    thumbnail_url: Property.ShortText({
      displayName: 'Thumbnail URL',
      description: 'Image URL for the web post thumbnail.',
      required: false,
    }),
    thumbnail_alt: Property.ShortText({
      displayName: 'Thumbnail Alt Text',
      description: 'Alt text for the web post thumbnail.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const body = kitCommon.compact({
      subject: props.subject,
      content: props.content,
      description: props.description,
      email_address:
        props.email_address === undefined || props.email_address === null || props.email_address.trim() === ''
          ? undefined
          : kitCommon.email({ value: props.email_address, label: 'From Email Address' }),
      email_layout_template: props.email_layout_template,
      send_at: kitCommon.toDateTime({ value: props.send_at, label: 'Send At', future: true }),
      public: props.public === true ? true : undefined,
      published_at: kitCommon.toDateTime({ value: props.published_at, label: 'Published At' }),
      thumbnail_url: props.thumbnail_url,
      thumbnail_alt: props.thumbnail_alt,
    });
    const response = await kitClient.request<{ broadcast: Broadcast }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/broadcasts',
      body,
    });
    return response.body.broadcast;
  },
});
