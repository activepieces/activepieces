import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const PARTNER_ITEM_TYPES = ['channel', 'team'];

export const createTeamsIntegrationMappingAction = createAction({
  auth: boxAuth,
  name: 'box_create_teams_integration_mapping',
  displayName: 'Create Teams Integration Mapping',
  description: 'Maps a Microsoft Teams channel or team to a Box folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Maps a Microsoft Teams channel or team to a Box folder and returns the mapping ID. Needs an admin or co-admin and Box for Teams, plus the Teams tenant and team IDs; get the folder ID from List Folder Items or Create Folder.',
    idempotent: false,
  },
  props: {
    partnerItemType: Property.StaticDropdown({
      displayName: 'Teams Item Type',
      description: '"channel" or "team".',
      required: true,
      options: { options: PARTNER_ITEM_TYPES.map((value) => ({ label: value, value })) },
    }),
    partnerItemId: boxAiProps.teamsItemId({ required: true }),
    tenantId: Property.ShortText({
      displayName: 'Tenant ID',
      description: 'ID of the Microsoft tenant registered with Teams.',
      required: true,
    }),
    teamId: Property.ShortText({
      displayName: 'Team ID',
      description: 'ID of the team registered with Teams (the team itself when mapping a team).',
      required: true,
    }),
    boxFolderId: boxAiProps.folderId({ required: true, displayName: 'Box Folder ID', description: 'ID of the Box folder to map to.' }),
  },
  async run({ auth, propsValue }) {
    if (!PARTNER_ITEM_TYPES.includes(propsValue.partnerItemType)) {
      throw new Error(`Teams Item Type must be one of: ${PARTNER_ITEM_TYPES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/integration_mappings/teams',
      body: {
        partner_item: {
          type: propsValue.partnerItemType,
          id: propsValue.partnerItemId,
          tenant_id: propsValue.tenantId,
          team_id: propsValue.teamId,
        },
        box_item: { type: 'folder', id: propsValue.boxFolderId },
      },
    });
  },
});
