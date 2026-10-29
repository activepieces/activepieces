import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropGetUserByNameOutputSchema } from '../../../output-schemas';

export const raindropGetUserByNameAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_get_user_by_name',
  outputSchema: raindropGetUserByNameOutputSchema,
  displayName: 'Get User by Name',
  description: 'Gets the public profile of a Raindrop.io user by username.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Returns the public profile (ID, full name, Pro status, registration date) of any Raindrop.io user by username. Use Get Current User for the connected account's own details. Fails with 404 when the username does not exist.",
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Username',
      description: "The Raindrop.io username, as shown in the user's public profile URL.",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropGetUserByNameResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/user/name/${encodeURIComponent(propsValue.name)}`,
    });
  },
});

type RaindropGetUserByNameResponse = {
  result: boolean;
  user: Record<string, unknown>;
};
