import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figmaAuth } from '../auth';
import { figmaClient } from '../common/client';
import { figmaOutputSchemas } from '../output-schemas';

export const getCurrentUserAction = createAction({
  auth: figmaAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Gets the Figma user of this connection.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the connected Figma user {id, handle, email, img_url}. Use the id to recognise your own comments or reactions. Needs the current_user:read scope. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: figmaOutputSchemas.currentUser,
  props: {},
  async run(context) {
    const response = await figmaClient.request<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v1/me',
      scope: 'current_user:read',
      tier: 3,
      operation: 'get the current user',
    });
    const body = figmaClient.isRecord(response.body) ? response.body : {};
    return { id: body['id'] ?? null, handle: body['handle'] ?? null, email: body['email'] ?? null, img_url: body['img_url'] ?? null };
  },
});
