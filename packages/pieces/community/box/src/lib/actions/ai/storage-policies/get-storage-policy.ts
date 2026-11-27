import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getStoragePolicyAction = createAction({
  auth: boxAuth,
  name: 'box_get_storage_policy',
  displayName: 'Get Storage Policy',
  description: 'Gets a Box storage policy.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one storage policy (Box Zones data region) by ID with its name. Get the ID from List Storage Policies.',
    idempotent: true,
  },
  props: {
    storagePolicyId: boxAiProps.storagePolicyId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/storage_policies/${encodeURIComponent(propsValue.storagePolicyId)}`,
    });
  },
});
