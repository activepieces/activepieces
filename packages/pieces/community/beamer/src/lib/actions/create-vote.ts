import { HttpMethod } from '@activepieces/pieces-common';
import { beamerAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { beamerClient } from '../common/client';

export const createVoteAction = createAction({
  auth: beamerAuth,
  name: 'create_vote',
  classification: 'WRITE',
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
    return await beamerClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/requests/${context.propsValue.featureRequestId}/votes`,
      body: {
        userFirstname: context.propsValue.userFirstname,
        email: context.propsValue.userEmail,
      },
    });
  },
});
