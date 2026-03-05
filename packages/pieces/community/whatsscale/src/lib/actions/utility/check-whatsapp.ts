import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';

export const checkWhatsappAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_check_whatsapp',
  displayName: 'Check WhatsApp Number',
  description: 'Check if a phone number has WhatsApp',
  props: {
    session: whatsscaleProps.session,
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Phone number in any format: +31 6 12345678 or 31612345678. Proxy normalizes automatically.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      '/make/checkWhatsapp',
      {
        session: context.propsValue.session,
        phone: context.propsValue.phone,
      }
    );

    return response.body;
  },
});
