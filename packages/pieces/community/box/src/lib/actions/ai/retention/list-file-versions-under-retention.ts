import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listFileVersionsUnderRetentionAction = createAction({
  auth: boxAuth,
  name: 'box_list_file_versions_under_retention',
  displayName: 'List File Versions Under Retention',
  description: 'Lists the file versions kept by a Box retention policy assignment.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the file versions retained by a retention policy assignment. Page with Marker (next_marker); use List Files Under Retention for current files. Get the ID from List Retention Policy Assignments.',
    idempotent: true,
  },
  props: {
    retentionPolicyAssignmentId: boxAiProps.retentionPolicyAssignmentId({ required: true }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/retention_policy_assignments/${encodeURIComponent(propsValue.retentionPolicyAssignmentId)}/file_versions_under_retention`,
      query: {
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
