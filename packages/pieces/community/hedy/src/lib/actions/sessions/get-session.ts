import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { HedyApiClient, unwrapResource } from '../../common/client';
import { commonProps } from '../../common/props';
import { Session } from '../../common/types';

export const getSession = createAction({
  auth: hedyAuth,
  name: 'get-session',
  displayName: 'Get Session',
  description: 'Retrieve a specific session by ID.',
  props: {
    sessionId: commonProps.sessionId,
  },
  async run(context) {
    const sessionId = context.propsValue.sessionId as string;
    const client = new HedyApiClient(context.auth as string);
    const response = await client.request<Session>({
      method: HttpMethod.GET,
      path: `/sessions/${sessionId}`,
    });

    return unwrapResource(response);
  },
});
