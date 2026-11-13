import { createAction } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearUserNode } from './common';
import { VIEWER_GET_QUERY } from './queries';
import { atomicViewerOutputSchema } from './output-schemas';

export const linearViewerGetAtomic = createAction({
  auth: linearAuth,
  name: 'linear_viewer_get',
  classification: 'READ',
  displayName: 'Get Current User (AI)',
  description: 'Get the user who owns the API key, and the workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the Linear user who owns the connection\'s API key (ID, name, email, admin flag) and the workspace it belongs to. Use to assign something to "me", to check whether the key is an admin key before webhook or team actions, or to confirm the connection works. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: atomicViewerOutputSchema,
  async run({ auth }) {
    const data = await linearGraphql.request<{ viewer: LinearUserNode }>({ auth, query: VIEWER_GET_QUERY });
    return atomicMappers.flattenViewer(data.viewer);
  },
});
