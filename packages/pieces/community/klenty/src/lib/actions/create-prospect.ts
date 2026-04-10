import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { klentyAuth } from '../auth';
import { klentyRequest } from '../common/client';
import { buildProspectPayload, prospectCommonProps } from '../common/props';

export const createProspectAction = createAction({
  name: 'create_prospect',
  displayName: 'Create Prospect',
  description: 'Create a new prospect in Klenty.',
  auth: klentyAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    ...prospectCommonProps,
  },
  async run({ auth, propsValue }) {
    const response = await klentyRequest({
      auth,
      method: HttpMethod.POST,
      path: '/prospects',
      body: buildProspectPayload(propsValue),
    });

    return response;
  },
});
