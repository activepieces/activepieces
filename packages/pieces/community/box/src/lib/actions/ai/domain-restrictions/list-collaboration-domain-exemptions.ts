import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listCollaborationDomainExemptionsAction = createAction({
  auth: boxAuth,
  name: 'box_list_collaboration_domain_exemptions',
  displayName: 'List Collaboration Domain Exemptions',
  description: 'Lists the users exempt from Box collaboration domain restrictions.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the users exempt from the enterprise\'s collaboration domain restrictions, each with its exemption ID and user. Needs admin rights. Page with Marker (next_marker).',
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
      path: '/collaboration_whitelist_exempt_targets',
      query: {
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
