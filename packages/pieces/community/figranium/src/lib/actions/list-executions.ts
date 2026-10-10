import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumAuth } from '../auth';
import { figraniumClient } from '../common/client';

export const listExecutionsAction = createAction({
  auth: figraniumAuth,
  name: 'list_executions',
  displayName: 'List Executions',
  description: 'Return a summary of all past task executions',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists a summary of all past Figranium task executions. Use this to check recent run history or find an execution to inspect further. Safe to retry.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return figraniumClient({
      baseUrl: context.auth.props.baseUrl,
      apiKey: context.auth.props.apiKey,
      method: HttpMethod.GET,
      resourceUri: '/api/executions/list',
    });
  },
});
