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
  audience: 'both',
  aiMetadata: {
    description: 'Fetch a single Hedy session context by its ID (must be prefixed with "ctx_"). Use when you already have a context ID and need its details. Read-only and idempotent.',
    idempotent: true,
  },
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
