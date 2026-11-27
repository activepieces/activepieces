import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getMetadataCascadePolicyAction = createAction({
  auth: boxAuth,
  name: 'box_get_metadata_cascade_policy',
  displayName: 'Get Metadata Cascade Policy',
  description: 'Gets a Box metadata cascade policy.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one cascade policy: its folder, scope and template key. Get the ID from List Metadata Cascade Policies or Create Metadata Cascade Policy.',
    idempotent: true,
  },
  props: {
    metadataCascadePolicyId: boxAiProps.metadataCascadePolicyId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/metadata_cascade_policies/${encodeURIComponent(propsValue.metadataCascadePolicyId)}`,
    });
  },
});
