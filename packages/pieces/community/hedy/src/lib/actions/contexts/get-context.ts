import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient, unwrapResource } from '../../common/client';
import { commonProps } from '../../common/props';
import { SessionContext } from '../../common/types';
import { assertIdPrefix } from '../../common/validation';

export const getContext = createAction({
  auth: hedyAuth,
  name: 'get-context',
  displayName: 'Get Session Context',
  description: 'Retrieve a specific session context by ID.',
  props: {
    contextId: commonProps.contextId,
  },
  async run(context) {
    const contextId = assertIdPrefix(
      context.propsValue.contextId as string,
      'ctx_',
      'Context ID',
    );
    const client = createClient(context.auth);
    const response = await client.request<SessionContext>({
      method: HttpMethod.GET,
      path: `/contexts/${contextId}`,
    });

    return unwrapResource(response);
  },
});
