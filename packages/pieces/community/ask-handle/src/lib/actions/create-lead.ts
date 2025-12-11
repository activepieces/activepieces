import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { askHandleAuth } from '../common/auth';
import { askHandleApiCall } from '../common/client';

export const createLead = createAction({
  auth: askHandleAuth,
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Create a new lead',
  props: {
    nickname: Property.ShortText({
      displayName: 'Nickname',
      description: 'Lead nickname',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Lead email',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Lead phone number',
      required: false,
    }),
    device: Property.ShortText({
      displayName: 'Device',
      description: 'Device information',
      required: false,
    }),
    from_page_title: Property.ShortText({
      displayName: 'From Page Title',
      description: 'Page title where lead originated',
      required: false,
    }),
    referrer: Property.ShortText({
      displayName: 'Referrer',
      description: 'Referrer URL',
      required: false,
    }),
  },
  async run(context) {
    const {
      nickname,
      email,
      phone_number,
      device,
      from_page_title,
      referrer,
    } = context.propsValue;

    const payload: any = {};

    if (nickname) payload.nickname = nickname;
    if (email) payload.email = email;
    if (phone_number) payload.phone_number = phone_number;
    if (device) payload.device = device;
    if (from_page_title) payload.from_page_title = from_page_title;
    if (referrer) payload.referrer = referrer;

    return await askHandleApiCall(
      context.auth.secret_text,
      HttpMethod.POST,
      '/leads/',
      payload
    );
  },
});

