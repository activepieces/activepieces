import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listFilesOnLegalHoldAction = createAction({
  auth: boxAuth,
  name: 'box_list_files_on_legal_hold',
  displayName: 'List Files On Legal Hold',
  description: 'Lists the files held by a Box legal hold policy assignment.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the files (with their current version) held by a legal hold policy assignment. Page with Marker (next_marker); use List File Versions On Legal Hold for older versions. Get the ID from List Legal Hold Policy Assignments.',
    idempotent: true,
  },
  props: {
    legalHoldPolicyAssignmentId: boxAiProps.legalHoldPolicyAssignmentId({ required: true }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/legal_hold_policy_assignments/${encodeURIComponent(propsValue.legalHoldPolicyAssignmentId)}/files_on_hold`,
      query: {
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        fields: propsValue.fields,
      },
    });
  },
});
