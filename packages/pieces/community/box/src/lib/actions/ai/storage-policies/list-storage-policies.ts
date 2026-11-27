import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listStoragePoliciesAction = createAction({
  auth: boxAuth,
  name: 'box_list_storage_policies',
  displayName: 'List Storage Policies',
  description: 'Lists the storage policies (data regions) of the Box enterprise.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the storage policies (Box Zones data regions) available to the enterprise, with their IDs and names. Needs admin rights and Box Zones. Page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/storage_policies',
      query: {
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        fields: propsValue.fields,
      },
    });
  },
});
