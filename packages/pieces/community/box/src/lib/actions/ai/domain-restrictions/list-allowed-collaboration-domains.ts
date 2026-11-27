import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listAllowedCollaborationDomainsAction = createAction({
  auth: boxAuth,
  name: 'box_list_allowed_collaboration_domains',
  displayName: 'List Allowed Collaboration Domains',
  description: 'Lists the domains the Box enterprise allows collaboration with.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the enterprise\'s allowed collaboration domains, each with its entry ID, domain and direction. Needs admin rights. Page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/collaboration_whitelist_entries',
      query: {
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
