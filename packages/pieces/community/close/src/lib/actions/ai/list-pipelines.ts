import { createAction } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

export const listPipelines = createAction({
  auth: closeAuth,
  name: 'list_pipelines',
  classification: 'SEARCH',
  displayName: 'List Pipelines',
  description: 'List opportunity pipelines and their statuses.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists every opportunity pipeline in the Close organization with id (pipe_...), name and its ordered opportunity statuses (id stat_..., label, type active/won/lost). Use a status id when creating or updating an opportunity. Read-only.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.pipelines,
  props: {},
  async run({ auth }) {
    const { items, truncated } = await closeClient.listAll({ auth, path: '/pipeline/' });
    return closeMappers.offsetPage({ items, hasMore: truncated, nextSkip: null, map: closeMappers.pipeline });
  },
});
