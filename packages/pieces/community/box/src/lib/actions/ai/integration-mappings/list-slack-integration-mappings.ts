import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxListSlackIntegrationMappingsOutputSchema } from '../../../output-schemas';

export const listSlackIntegrationMappingsAction = createAction({
  auth: boxAuth,
  name: 'box_list_slack_integration_mappings',
  outputSchema: boxListSlackIntegrationMappingsOutputSchema,
  displayName: 'List Slack Integration Mappings',
  description: 'Lists the mappings between Slack channels and Box folders.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the enterprise\'s Slack channel to Box folder mappings with their IDs, optionally for one channel or folder. Needs an admin or co-admin and Box for Slack. Page with Marker (next_marker). Use a mapping ID in Update or Delete Slack Integration Mapping.',
    idempotent: true,
  },
  props: {
    channelId: boxAiProps.slackChannelId({
      required: false,
      description: 'Only the mapping for this Slack channel ID, e.g. "C12378991223".',
    }),
    boxFolderId: boxAiProps.folderId({ required: false, displayName: 'Box Folder ID', description: 'Only mappings to this Box folder ID.' }),
    isManuallyCreated: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Manually Created',
      description: '"true" for only manually created mappings, "false" for only automatic ones.',
    }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/integration_mappings/slack',
      query: {
        partner_item_type: propsValue.channelId !== undefined ? 'channel' : undefined,
        partner_item_id: propsValue.channelId,
        box_item_type: propsValue.boxFolderId !== undefined ? 'folder' : undefined,
        box_item_id: propsValue.boxFolderId,
        is_manually_created: propsValue.isManuallyCreated,
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
      },
    });
  },
});
