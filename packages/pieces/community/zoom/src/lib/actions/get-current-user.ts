import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { zoomClient } from '../common/client';
import { getCurrentUserOutputSchema } from '../output-schemas';

export const zoomGetCurrentUser = createAction({
  auth: zoomAuth,
  name: 'zoom_get_current_user',
  displayName: 'Get Current User',
  description: 'Get the profile of the Zoom user behind this connection.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description: "Returns the profile of the Zoom user behind this connection (ID, email, name, plan type, timezone, personal meeting ID). Use to learn whose account the agent acts on, whether the plan is free or licensed, or the user's timezone before scheduling. Read-only and idempotent.",
    idempotent: true,
  },
  outputSchema: getCurrentUserOutputSchema,
  props: {},
  async run(context) {
    return zoomClient.requestObject({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      path: '/users/me',
      scope: 'user:read:user',
    });
  },
});
