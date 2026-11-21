import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const getWorkOverlapStats = createAction({
  auth: villageAuth,
  name: 'get_work_overlap_stats',
  classification: 'READ',
  displayName: 'Get Work Overlap Stats',
  description: 'Get how many people you, and your first-degree network, overlapped with at past employers. Free.',
  audience: 'human',
  aiMetadata: {
    description: 'Counts of the caller\'s own and network work overlaps. Free, read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.getWorkOverlapStats,
  props: {},
  async run(context) {
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/user/work-overlaps/stats',
    });
  },
});
