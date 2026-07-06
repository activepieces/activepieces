import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { beamerAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { beamerCommon } from '../common';

export const createVote = createAction({
  auth: beamerAuth,
  name: 'create_vote',
  displayName: 'Create a new vote ',
  description: 'Create a new vote on a feature request',
  audience: 'both',
  aiMetadata: {
    description: 'Casts a vote on an existing Beamer feature request, identified by its numeric feature request ID, optionally attributed to a voter by first name and email. Use to register user support for a feedback item. Records a vote on each call (not idempotent).',
    idempotent: false,
  },
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
    const apiKey = context.auth.secret_text;

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
