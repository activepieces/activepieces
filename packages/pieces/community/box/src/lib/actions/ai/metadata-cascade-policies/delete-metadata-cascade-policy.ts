import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteMetadataCascadePolicyAction = createAction({
  auth: boxAuth,
  name: 'box_delete_metadata_cascade_policy',
  displayName: 'Delete Metadata Cascade Policy',
  description: 'Deletes a Box metadata cascade policy.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a cascade policy so the folder\'s metadata stops cascading to new items; it can\'t be undone. Get the ID from List Metadata Cascade Policies.',
    idempotent: false,
  },
  props: {
    metadataCascadePolicyId: boxAiProps.metadataCascadePolicyId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/metadata_cascade_policies/${encodeURIComponent(propsValue.metadataCascadePolicyId)}`,
    });
    return { deleted: true, metadataCascadePolicyId: propsValue.metadataCascadePolicyId };
  },
});
