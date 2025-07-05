import { createAction, Property } from '@activepieces/pieces-framework';
import {clicksendAuth} from "../../index"
import { makeRequest } from '../common';
import { countryDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendMms = createAction({
  auth: clicksendAuth,
  name: 'sendMms',
  displayName: 'Send MMS',
  description: 'Send one or more MMS messages via ClickSend',
  props: {
    media_file: Property.ShortText({
      displayName: 'Media File URL',
      description:
        'URL to the media file (jpg, gif, jpeg, png, bmp, max 250kB)',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject line (max 20 characters)',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From (Sender ID)',
      description: 'Your sender ID (must be set up in ClickSend)',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Message Body',
      description: 'The message to send',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description: 'Recipient phone number in E.164 format (e.g. +61411111111)',
      required: true,
    }),
    country: countryDropdown,
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Source identifier (e.g., "php", "api", etc.)',
      required: false,
      defaultValue: 'api',
    }),
  },
  async run({ auth, propsValue }) {
    const { media_file, subject, from, body, to, country, source } = propsValue;
    const { username, password } = auth;
    const apiKey = `${username}:${password}`;

    const requestBody = {
      media_file,
      messages: [
        {
          source: source || 'api',
          subject,
          from,
          body,
          to,
          country,
        },
      ],
    };

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/mms/send`,
      undefined,
      requestBody
    );

    return response;
  },
});
