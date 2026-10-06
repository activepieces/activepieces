import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { GoogleWorkspaceApi } from '../common/client';
import { RESOURCES } from '../common/resources';
import { resolveAuth } from '../common/token';
import { suspendUserOutputSchema } from '../output-schemas';

export const suspendUser = createAction({
  name: 'suspendUser',
  classification: 'DESTRUCTIVE',
  displayName: 'Suspend User',
  description: 'Suspend a directory user (blocks sign-in, keeps data), or lift the suspension',
  audience: 'both',
  aiMetadata: {
    description:
      'Suspends a Google Workspace user (blocks sign-in and access while keeping the account and its data) or, with Suspended off, reactivates a suspended user. Prefer this over Delete Record when offboarding. Sets the user to the requested state, so retries are safe.',
    idempotent: true,
  },
  auth: googleWorkspaceAuth,
  props: {
    userKey: Property.ShortText({
      displayName: 'User',
      description: 'Primary e-mail, alias or id of the user.',
      required: true,
    }),
    suspended: Property.Checkbox({
      displayName: 'Suspended',
      description: 'On: suspend the user. Off: reactivate a suspended user.',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: suspendUserOutputSchema,
  async run(context) {
    const { userKey, suspended } = context.propsValue;
    const auth = await resolveAuth(context.auth);
    const value = suspended !== false;

    const user = await GoogleWorkspaceApi.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.PATCH,
      path: RESOURCES.user.itemPath({ id: userKey }),
      body: { suspended: value },
    });

    return {
      id: user['id'] ?? null,
      primaryEmail: user['primaryEmail'] ?? null,
      suspended: typeof user['suspended'] === 'boolean' ? user['suspended'] : value,
      suspensionReason: user['suspensionReason'] ?? null,
      record: user,
    };
  },
});
