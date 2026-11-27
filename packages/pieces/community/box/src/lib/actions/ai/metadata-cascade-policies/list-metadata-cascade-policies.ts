import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxListMetadataCascadePoliciesOutputSchema } from '../../../output-schemas';

export const listMetadataCascadePoliciesAction = createAction({
  auth: boxAuth,
  name: 'box_list_metadata_cascade_policies',
  outputSchema: boxListMetadataCascadePoliciesOutputSchema,
  displayName: 'List Metadata Cascade Policies',
  description: 'Lists the metadata cascade policies on a Box folder.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the cascade policies on a folder, with their IDs for Get, Apply or Delete Metadata Cascade Policy. Not available on the root folder "0". Page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({
      required: true,
      description: 'Box folder ID, not the root "0". Get it from List Folder Items, Search or Create Folder.',
    }),
    ownerEnterpriseId: boxAiProps.enterpriseId({
      required: false,
      displayName: 'Owner Enterprise ID',
      description: 'Enterprise whose policies to list. Defaults to the current enterprise.',
    }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/metadata_cascade_policies',
      query: {
        folder_id: propsValue.folderId,
        owner_enterprise_id: propsValue.ownerEnterpriseId,
        marker: propsValue.marker,
      },
    });
  },
});
