import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteTeamsIntegrationMappingAction = createAction({
  auth: boxAuth,
  name: 'box_delete_teams_integration_mapping',
  displayName: 'Delete Teams Integration Mapping',
  description: 'Removes the mapping between a Microsoft Teams channel or team and a Box folder.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes a Microsoft Teams channel or team to Box folder mapping. Needs an admin or co-admin and Box for Teams. Get the mapping ID from List Teams Integration Mappings.',
    idempotent: false,
  },
  props: {
    integrationMappingId: boxAiProps.integrationMappingId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/integration_mappings/teams/${encodeURIComponent(propsValue.integrationMappingId)}`,
    });
    return { deleted: true, integrationMappingId: propsValue.integrationMappingId };
  },
});
