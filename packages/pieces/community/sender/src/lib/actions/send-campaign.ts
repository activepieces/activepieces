import { createAction } from '@activepieces/pieces-framework';
import { senderAuth } from '../auth';
import { senderApi } from '../common/api';
import { senderProps } from '../common/props';

export const sendCampaignAction = createAction({
  auth: senderAuth,
  name: 'send_campaign',
  classification: 'WRITE',
  displayName: 'Send Campaign',
  description: 'Trigger sending of a drafted campaign to its recipient list',
  audience: 'both',
  aiMetadata: { description: 'Sends an existing draft campaign in a Sender account to its configured recipient groups, identified by campaign ID. Use only after a campaign draft is created and ready to deliver. Not idempotent: this dispatches email to recipients, so re-running may re-send or error; call once.', idempotent: false },
  props: {
    campaignId: senderProps.campaignId({ required: true }),
  },
  async run(context) {
    return await senderApi.sendCampaign({
      auth: context.auth,
      campaignId: context.propsValue.campaignId,
    });
  },
});
