import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Broadcast } from '../../common/types';
import { kitBroadcastOutputSchema } from '../../output-schemas';

export const kitUpdateBroadcast = createAction({
  auth: convertkitAuth,
  name: 'kit_update_broadcast',
  classification: 'WRITE',
  outputSchema: kitBroadcastOutputSchema,
  displayName: 'Update Broadcast',
  description: 'Change fields on an existing broadcast. Fields left empty are not changed.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the fields you pass on an existing broadcast, such as subject or content; everything left empty keeps its current value. Setting Send At schedules a real send to subscribers, and Publish As Web Post changes its web visibility, so only set them when the user asked. Get the broadcast ID from List Broadcasts.',
    idempotent: true,
  },
  props: {
    broadcast_id: kitProps.id('Broadcast ID', 'The broadcast ID, from List Broadcasts.'),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'New email subject line.',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'New email body. Plain text or simple HTML (p, h1, img, a).',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Internal Description',
      description: 'New internal note, not shown to subscribers.',
      required: false,
    }),
    email_address: Property.ShortText({
      displayName: 'From Email Address',
      description: 'New sending address. It must be a confirmed sender in Kit.',
      required: false,
    }),
    email_layout_template: Property.ShortText({
      displayName: 'Email Template Name',
      description: 'New email template name.',
      required: false,
    }),
    send_at: Property.DateTime({
      displayName: 'Send At',
      description:
        'Schedule a real send at this ISO 8601 date-time, which must be in the future. Leave empty to keep the current schedule.',
      required: false,
    }),
    public: Property.StaticDropdown({
      displayName: 'Publish As Web Post',
      description: 'Change web post visibility. Leave empty to keep it as it is.',
      required: false,
      options: {
        options: [
          { label: 'Publish as web post', value: 'true' },
          { label: 'Do not publish as web post', value: 'false' },
        ],
      },
    }),
    published_at: Property.DateTime({
      displayName: 'Published At',
      description: 'New publication time shown on the web post.',
      required: false,
    }),
    thumbnail_url: Property.ShortText({
      displayName: 'Thumbnail URL',
      description: 'New image URL for the web post thumbnail.',
      required: false,
    }),
    thumbnail_alt: Property.ShortText({
      displayName: 'Thumbnail Alt Text',
      description: 'New alt text for the web post thumbnail.',
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
      public: props.public === undefined || props.public === null ? undefined : props.public === 'true',
      published_at: kitCommon.toDateTime({ value: props.published_at, label: 'Published At' }),
      thumbnail_url: props.thumbnail_url,
      thumbnail_alt: props.thumbnail_alt,
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const response = await kitClient.request<{ broadcast: Broadcast }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: `/broadcasts/${kitCommon.id({ value: props.broadcast_id, label: 'Broadcast ID' })}`,
      body,
    });
    return response.body.broadcast;
  },
});
