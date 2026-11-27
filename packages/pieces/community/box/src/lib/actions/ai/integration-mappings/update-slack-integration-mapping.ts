import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const updateSlackIntegrationMappingAction = createAction({
  auth: boxAuth,
  name: 'box_update_slack_integration_mapping',
  displayName: 'Update Slack Integration Mapping',
  description: 'Changes the Box folder or options of a Slack channel mapping.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Points a Slack channel mapping at another Box folder and/or changes whether Box manages channel members\' access; give at least one. Needs an admin or co-admin and Box for Slack. Get the mapping ID from List Slack Integration Mappings.',
    idempotent: true,
  },
  props: {
    integrationMappingId: boxAiProps.integrationMappingId({
      required: true,
      description: 'The mapping ID, from List Slack Integration Mappings.',
    }),
    boxFolderId: boxAiProps.folderId({ required: false, displayName: 'Box Folder ID', description: 'ID of the new Box folder for the channel.' }),
    isAccessManagementDisabled: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Access Management Disabled',
      description: '"true" to stop Box from managing channel members\' access to the folder, "false" to resume it.',
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.boxFolderId === undefined && propsValue.isAccessManagementDisabled === undefined) {
      throw new Error('Give Box Folder ID, Access Management Disabled, or both.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/integration_mappings/slack/${encodeURIComponent(propsValue.integrationMappingId)}`,
      body: {
        ...(propsValue.boxFolderId !== undefined ? { box_item: { type: 'folder', id: propsValue.boxFolderId } } : {}),
        ...(propsValue.isAccessManagementDisabled !== undefined
          ? { options: { is_access_management_disabled: propsValue.isAccessManagementDisabled === 'true' } }
          : {}),
      },
    });
  },
});
