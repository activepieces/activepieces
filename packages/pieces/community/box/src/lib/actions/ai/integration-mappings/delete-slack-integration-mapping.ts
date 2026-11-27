import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteSlackIntegrationMappingAction = createAction({
  auth: boxAuth,
  name: 'box_delete_slack_integration_mapping',
  displayName: 'Delete Slack Integration Mapping',
  description: 'Removes the mapping between a Slack channel and a Box folder.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes a Slack channel to Box folder mapping. Needs an admin or co-admin and Box for Slack. Get the mapping ID from List Slack Integration Mappings.',
    idempotent: false,
  },
  props: {
    integrationMappingId: boxAiProps.integrationMappingId({
      required: true,
      description: 'The mapping ID, from List Slack Integration Mappings.',
    }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/integration_mappings/slack/${encodeURIComponent(propsValue.integrationMappingId)}`,
    });
    return { deleted: true, integrationMappingId: propsValue.integrationMappingId };
  },
});
