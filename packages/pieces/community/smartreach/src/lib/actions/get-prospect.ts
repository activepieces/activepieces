import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { smartreachAuth } from '../..';
import { SMARTREACH_API_BASE, getHeaders } from '../common';

export const getProspect = createAction({
  name: 'getProspect',
  auth: smartreachAuth,
  displayName: 'Get Prospect',
  description: 'Retrieve details of a prospect by ID or email',
  props: {
    prospectId: Property.ShortText({
      displayName: 'Prospect ID',
      required: false,
      description: 'ID of the prospect to retrieve',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
      description: 'Email address of the prospect to retrieve',
    }),
  },

  async run(context) {
    const { prospectId, email } = context.propsValue;

    if (!prospectId && !email) {
      throw new Error('Either Prospect ID or Email must be provided');
    }

    let url: string;
    if (prospectId) {
      url = `${SMARTREACH_API_BASE}/prospects/${prospectId}`;
    } else {
      url = `${SMARTREACH_API_BASE}/prospects?email=${encodeURIComponent(email!)}`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: getHeaders(context.auth),
    });

    return response.body;
  },
});
