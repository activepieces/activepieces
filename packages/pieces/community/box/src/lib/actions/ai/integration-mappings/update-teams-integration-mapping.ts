import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const updateTeamsIntegrationMappingAction = createAction({
  auth: boxAuth,
  name: 'box_update_teams_integration_mapping',
  displayName: 'Update Teams Integration Mapping',
  description: 'Points a Microsoft Teams mapping at another Box folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Points a Microsoft Teams channel or team mapping at another Box folder. Needs an admin or co-admin and Box for Teams. Get the mapping ID from List Teams Integration Mappings.',
    idempotent: true,
  },
  props: {
    integrationMappingId: boxAiProps.integrationMappingId({ required: true }),
    boxFolderId: boxAiProps.folderId({ required: true, displayName: 'Box Folder ID', description: 'ID of the new Box folder for the mapping.' }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/integration_mappings/teams/${encodeURIComponent(propsValue.integrationMappingId)}`,
      body: { box_item: { type: 'folder', id: propsValue.boxFolderId } },
    });
  },
});
