import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { klentyAuth } from '../auth';
import { klentyRequest } from '../common/client';
import { buildProspectPayload, prospectCommonProps } from '../common/props';

export const updateProspectAction = createAction({
  name: 'update_prospect',
  displayName: 'Update Prospect',
  description: 'Update an existing prospect in Klenty by email address.',
  auth: klentyAuth,
  props: {
    currentEmail: Property.ShortText({
      displayName: 'Current Prospect Email',
      description: 'The current email used to identify the prospect in Klenty.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'New Email',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    ...prospectCommonProps,
  },
  async run({ auth, propsValue }) {
    const response = await klentyRequest({
      auth,
      method: HttpMethod.POST,
      path: `/prospects/${encodeURIComponent(String(propsValue.currentEmail))}`,
      body: buildProspectPayload(propsValue),
    });

    return response;
  },
});
