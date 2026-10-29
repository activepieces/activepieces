import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropAcceptInvitationOutputSchema } from '../../../output-schemas';

export const raindropAcceptInvitationAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_accept_invitation',
  displayName: 'Accept Invitation',
  description: 'Joins a shared collection using an invitation token.',
  audience: 'ai',
  outputSchema: raindropAcceptInvitationOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Joins a collection another user shared with you, using the secret token from the invitation email sent by Share Collection. Fails if the token is wrong or expired, or if you already own the collection.',
    idempotent: false,
  },
  props: {
    collectionId: raindropAiProps.collectionId({
      required: true,
      description: 'ID of the collection you were invited to, from the invitation email.',
    }),
    token: Property.ShortText({
      displayName: 'Invitation Token',
      description: 'Secret token from the invitation email link.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropAcceptInvitationResponse>({
      auth,
      method: HttpMethod.POST,
      path: `/collection/${encodeURIComponent(propsValue.collectionId)}/join`,
      body: { token: propsValue.token },
    });
  },
});

type RaindropAcceptInvitationResponse = {
  result: boolean;
  role: string;
};
