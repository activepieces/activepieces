import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { resolveSendResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { ChatType } from '../../../common/types';
import { buildRecipientBody, RecipientType } from '../../../common/recipients';

export const sendLocationManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_location_manual',
  classification: 'WRITE',
  displayName: 'Send a Location (By ID)',
  description: 'Send GPS coordinates to a contact, group, channel, or CRM contact by ID rather than picking from a list.',
  audience: 'both',
  aiMetadata: { description: 'Sends a GPS location to a recipient identified directly by ID rather than a builder dropdown, with an optional place name. WhatsApp does not support locations in channels, so channel is not offered as a recipient type. Not idempotent: each call sends another location message.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Recipient Type',
      description: 'Who this location is being sent to.',
      required: true,
      display: 'cards',
      options: {
        options: [
          { label: 'Contact', value: ChatType.CONTACT, description: 'A phone number with country code', icon: 'user' },
          { label: 'Group', value: ChatType.GROUP, description: 'A WhatsApp group by ID', icon: 'users' },
          { label: 'CRM Contact', value: ChatType.CRM_CONTACT, description: 'A WhatsScale CRM contact by ID', icon: 'tag' },
        ],
      },
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient ID',
      description:
        'Contact: the phone number in international format, digits only (e.g. 31649931832 — no +, spaces or dashes). Group: the bare ID, no @ suffix needed. CRM Contact: the CRM contact ID. A full chat ID is also accepted and passed through unchanged, so the Chat ID returned by Check WhatsApp Number (31649931832@c.us) or by a previous send (31649931832@s.whatsapp.net) can be fed straight in.',
      required: true,
    }),
    latitude: Property.Number({
      displayName: 'Latitude',
      description: 'Between -90 and 90.',
      required: true,
    }),
    longitude: Property.Number({
      displayName: 'Longitude',
      description: 'Between -180 and 180.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Location Name',
      description: 'Optional name shown with the pin (e.g. "Main Office").',
      required: false,
    }),
  },
  propertyGroups: [
    { key: 'destination', display: 'section' as const, label: 'Destination', icon: 'send', props: ['session', 'chatType', 'recipient'] },
    { key: 'content', display: 'section' as const, label: 'Location', icon: 'location', props: ['latitude', 'longitude', 'title'] },
  ],
  async run(context) {
    const { session, chatType, recipient, latitude, longitude, title } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const recipientBody = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType,
    );

    const body: Record<string, unknown> = { ...recipientBody, latitude, longitude };
    if (title) body['title'] = title;

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendLocation', body);
    return await resolveSendResult({ apiKey: apiKey, body: response.body });
  },
});
