import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { beamerAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import { beamerCommon } from '../common';

export const createVote = createAction({
  auth: beamerAuth,
  name: 'create_vote',
  displayName: 'Create a new vote ',
  description: 'Create a new vote on a feature request',
  props: {
    featureRequestId: Property.Number({
      displayName: 'Feature ID',
      description: 'ID of the feature request to create a comment for',
      required: true,
    }),
    userFirstname: Property.ShortText({
      displayName: 'User Firstname',
      description: 'Feature requested by..',
      required: false,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      description: 'Feature requested by..',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${beamerCommon.baseUrl}/requests/${context.propsValue.featureRequestId}/votes`,
      headers: {
        'Beamer-Api-Key': `${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        userFirstname: context.propsValue.userFirstname,
        email: context.propsValue.userEmail,
      },
    };

    const res = await httpClient.sendRequest(request);
    return res.body;

  },
});
