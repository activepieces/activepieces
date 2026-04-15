import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';

export const findCrmContactByPhoneAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_find_crm_contact_by_phone',
  displayName: 'Find a CRM Contact by Phone',
  description: 'Look up a CRM contact using their phone number',
  props: {
    phone: Property.ShortText({
      displayName: 'Phone Number',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { phone } = context.propsValue;
    const encodedPhone = encodeURIComponent(phone);

    const response = await whatsscaleClient(
      auth,
      HttpMethod.GET,
      `/api/crm/contacts/phone/${encodedPhone}`,
      undefined
    );
    return response.body;
  },
});
