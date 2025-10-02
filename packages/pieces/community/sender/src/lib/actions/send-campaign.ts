import { createAction, Property } from '@activepieces/pieces-framework';
import { makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const sendCampaignAction = createAction({
  auth: senderAuth,
  name: 'send_campaign',
  displayName: 'Send Campaign',
  description: 'Trigger sending of a drafted campaign to its recipient list',
  props: {
    campaignId: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'The ID of the campaign to send',
      required: true,
    }),
  },
  async run(context) {
    const campaignId = context.propsValue.campaignId;
    const sendData: any = {};
    const response = await makeSenderRequest(
      context.auth,
      `/campaigns/${campaignId}/send`,
      HttpMethod.POST,
      sendData
    );

    return response.body;
  },
});