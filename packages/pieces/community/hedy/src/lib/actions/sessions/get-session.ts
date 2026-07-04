import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient, unwrapResource } from '../../common/client';
import { commonProps } from '../../common/props';
import { Session } from '../../common/types';
import { assertIdPrefix } from '../../common/validation';

export const getSession = createAction({
  auth: hedyAuth,
  name: 'get-session',
  displayName: 'Get Session',
  description: 'Retrieve a specific session by ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetch a single Hedy meeting session by its ID (must be prefixed with "sess_"). Use when you already have a session ID and need its details. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    sessionId: commonProps.sessionId,
  },
  async run(context) {
    const sessionId = assertIdPrefix(context.propsValue.sessionId as string, 'sess_', 'Session ID');
    const client = createClient(context.auth);
    const response = await client.request<Session>({
      method: HttpMethod.GET,
      path: `/sessions/${sessionId}`,
    });

    return unwrapResource(response);
  },
});
