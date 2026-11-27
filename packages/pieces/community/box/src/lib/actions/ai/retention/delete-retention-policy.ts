import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteRetentionPolicyAction = createAction({
  auth: boxAuth,
  name: 'box_delete_retention_policy',
  displayName: 'Delete Retention Policy',
  description: 'Permanently deletes a Box retention policy.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a retention policy; it cannot be restored. To stop a policy but keep its record, use Update Retention Policy with Status "retired". Get the ID from List Retention Policies.',
    idempotent: false,
  },
  props: {
    retentionPolicyId: boxAiProps.retentionPolicyId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/retention_policies/${encodeURIComponent(propsValue.retentionPolicyId)}`,
    });
    return { deleted: true, retentionPolicyId: propsValue.retentionPolicyId };
  },
});
