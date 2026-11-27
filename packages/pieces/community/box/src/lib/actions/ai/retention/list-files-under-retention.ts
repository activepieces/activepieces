import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listFilesUnderRetentionAction = createAction({
  auth: boxAuth,
  name: 'box_list_files_under_retention',
  displayName: 'List Files Under Retention',
  description: 'Lists the files kept by a Box retention policy assignment.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the files (with their current file version) retained by a retention policy assignment. Page with Marker (next_marker); use List File Versions Under Retention for older versions. Get the ID from List Retention Policy Assignments.',
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
      path: `/retention_policy_assignments/${encodeURIComponent(propsValue.retentionPolicyAssignmentId)}/files_under_retention`,
      query: {
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
