import { createAction } from '@activepieces/pieces-framework';
import {
  campaignDropdown,
  makeSenderRequest,
  senderAuth,
} from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendCampaignAction = createAction({
  auth: senderAuth,
  name: 'send_campaign',
  displayName: 'Send Campaign',
  description: 'Trigger sending of a drafted campaign to its recipient list',
  audience: 'both',
  aiMetadata: { description: 'Sends an existing draft campaign in a Sender account to its configured recipient groups, identified by campaign ID. Use only after a campaign draft is created and ready to deliver. Not idempotent: this dispatches email to recipients, so re-running may re-send or error; call once.', idempotent: false },
  props: {
    campaignId: campaignDropdown,
  },
  async run(context) {
    const campaignId = context.propsValue.campaignId;
    
    const response = await makeSenderRequest(
      context.auth.secret_text,
      `/campaigns/${campaignId}/send`,
      HttpMethod.POST,
    );

    return response.body;
  },
});
