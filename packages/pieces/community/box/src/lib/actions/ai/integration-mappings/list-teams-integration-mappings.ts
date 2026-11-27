import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const PARTNER_ITEM_TYPES = ['channel', 'team'];

export const listTeamsIntegrationMappingsAction = createAction({
  auth: boxAuth,
  name: 'box_list_teams_integration_mappings',
  displayName: 'List Teams Integration Mappings',
  description: 'Lists the mappings between Microsoft Teams channels or teams and Box folders.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the enterprise\'s Microsoft Teams channel or team to Box folder mappings with their IDs, optionally for one Teams item or folder; the result is not paged. Needs an admin or co-admin and Box for Teams. Use a mapping ID in Update or Delete Teams Integration Mapping.',
    idempotent: true,
  },
  props: {
    partnerItemType: Property.StaticDropdown({
      displayName: 'Teams Item Type',
      description: '"channel" or "team". Give with Teams Item ID.',
      required: false,
      options: { options: PARTNER_ITEM_TYPES.map((value) => ({ label: value, value })) },
    }),
    partnerItemId: boxAiProps.teamsItemId({
      required: false,
      description: 'Only the mapping for this Teams channel or team ID.',
    }),
    boxFolderId: boxAiProps.folderId({ required: false, displayName: 'Box Folder ID', description: 'Only mappings to this Box folder ID.' }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.partnerItemType !== undefined && !PARTNER_ITEM_TYPES.includes(propsValue.partnerItemType)) {
      throw new Error(`Teams Item Type must be one of: ${PARTNER_ITEM_TYPES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/integration_mappings/teams',
      query: {
        partner_item_type: propsValue.partnerItemType,
        partner_item_id: propsValue.partnerItemId,
        box_item_type: propsValue.boxFolderId !== undefined ? 'folder' : undefined,
        box_item_id: propsValue.boxFolderId,
      },
    });
  },
});
