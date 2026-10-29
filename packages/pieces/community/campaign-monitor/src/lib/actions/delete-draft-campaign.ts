import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId, draftCampaignId } from '../common/props';
import { deleteDraftCampaignOutputSchema } from '../output-schemas';

export const deleteDraftCampaignAction = createAction({
  auth: campaignMonitorAuth,
  name: 'delete_draft_campaign',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Draft Campaign',
  description: 'Permanently deletes a draft campaign.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a Campaign Monitor draft campaign and its content; it cannot be restored. Sent campaigns are not affected. Not idempotent: deleting the same campaign again fails because it no longer exists.',
    idempotent: false,
  },
  outputSchema: deleteDraftCampaignOutputSchema,
  props: {
    clientId: clientId,
    campaignId: draftCampaignId,
  },
  async run({ propsValue, auth }) {
    await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.DELETE,
      path: `/campaigns/${propsValue.campaignId}.json`,
    });
    return {
      success: true,
      campaignId: propsValue.campaignId,
    };
  },
});
