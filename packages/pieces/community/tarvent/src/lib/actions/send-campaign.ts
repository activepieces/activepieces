import { createAction } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const sendCampaign = createAction({
  auth: tarventAuth,
  name: 'tarvent_send_campaign',
  classification: 'WRITE',
  displayName: 'Send Campaign',
  description: 'Sends a copy of a campaign to its audience now.',
  audience: 'human',
  aiMetadata: {
    description:
      'Sends a copy of an existing, fully configured Tarvent campaign to its whole audience immediately. Every run emails the audience again. Not available to AI agents.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.campaignSent,
  props: {
    campaignId: tarventCommon.campaignId(true, 'Select which campaign to send. **NOTE:** Make sure all campaign settings are correct (from, subject, content) before configuring this automation. Every run sends the campaign to its audience again.', true),
  },
  async run(context) {
    const campaignId = tarventCommon.requireText({ value: context.propsValue.campaignId, label: 'Campaign' });
    const sendUtc = new Date().toISOString();
    await tarventClient.booleanMutation({
      auth: context.auth.props,
      operation: 'SendCampaignCopy',
      field: 'sendCampaignCopy',
      argDefs: '$id: String!, $sendsUtc: [DateTime!]!',
      args: 'id: $id, sendsUtc: $sendsUtc',
      variables: { id: campaignId, sendsUtc: [sendUtc] },
    });
    return { success: true, campaignId, sendUtc };
  },
});
