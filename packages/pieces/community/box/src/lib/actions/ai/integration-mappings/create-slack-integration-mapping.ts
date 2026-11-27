import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createSlackIntegrationMappingAction = createAction({
  auth: boxAuth,
  name: 'box_create_slack_integration_mapping',
  displayName: 'Create Slack Integration Mapping',
  description: 'Maps a Slack channel to a Box folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Maps a Slack channel to a Box folder so files shared in the channel are stored there, and returns the mapping ID. Give exactly one of Slack Workspace ID or Slack Org ID, matching how Box for Slack is installed. Needs an admin or co-admin and Box for Slack; get the folder ID from List Folder Items or Create Folder.',
    idempotent: false,
  },
  props: {
    channelId: boxAiProps.slackChannelId({ required: true }),
    slackWorkspaceId: Property.ShortText({
      displayName: 'Slack Workspace ID',
      description: 'Slack workspace ID, when Box for Slack is installed at workspace level. Not with Slack Org ID.',
      required: false,
    }),
    slackOrgId: Property.ShortText({
      displayName: 'Slack Org ID',
      description: 'Slack org ID, when Box for Slack is installed at org level. Not with Slack Workspace ID.',
      required: false,
    }),
    boxFolderId: boxAiProps.folderId({ required: true, displayName: 'Box Folder ID', description: 'ID of the Box folder to map the channel to.' }),
    isAccessManagementDisabled: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Access Management Disabled',
      description: '"true" to stop Box from managing channel members\' access to the folder (collaborations or shared links).',
    }),
  },
  async run({ auth, propsValue }) {
    if ((propsValue.slackWorkspaceId === undefined) === (propsValue.slackOrgId === undefined)) {
      throw new Error('Give exactly one of Slack Workspace ID or Slack Org ID.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/integration_mappings/slack',
      body: {
        partner_item: {
          type: 'channel',
          id: propsValue.channelId,
          ...(propsValue.slackWorkspaceId !== undefined ? { slack_workspace_id: propsValue.slackWorkspaceId } : {}),
          ...(propsValue.slackOrgId !== undefined ? { slack_org_id: propsValue.slackOrgId } : {}),
        },
        box_item: { type: 'folder', id: propsValue.boxFolderId },
        ...(propsValue.isAccessManagementDisabled !== undefined
          ? { options: { is_access_management_disabled: propsValue.isAccessManagementDisabled === 'true' } }
          : {}),
      },
    });
  },
});
