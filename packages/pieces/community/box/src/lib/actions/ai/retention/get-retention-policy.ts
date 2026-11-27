import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getRetentionPolicyAction = createAction({
  auth: boxAuth,
  name: 'box_get_retention_policy',
  displayName: 'Get Retention Policy',
  description: 'Gets the details of a Box retention policy.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one retention policy by ID: name, type, length, disposition action, status and assignment counts. Get the ID from List Retention Policies or Create Retention Policy.',
    idempotent: true,
  },
  props: {
    retentionPolicyId: boxAiProps.retentionPolicyId({ required: true }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/retention_policies/${encodeURIComponent(propsValue.retentionPolicyId)}`,
      query: { fields: propsValue.fields },
    });
  },
});
