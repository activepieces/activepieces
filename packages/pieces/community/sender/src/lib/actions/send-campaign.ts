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
    scheduleTime: Property.ShortText({
      displayName: 'Schedule Time',
      description: 'Optional: ISO 8601 datetime to schedule sending (leave empty to send immediately)',
      required: false,
    }),
  },
  async run(context) {
    const campaignId = context.propsValue.campaignId;
    const scheduleTime = context.propsValue.scheduleTime;

    const sendData: any = {};
    
    if (scheduleTime) {
      sendData.schedule_time = scheduleTime;
    }

    const response = await makeSenderRequest(
      context.auth,
      `/campaigns/${campaignId}/send`,
      HttpMethod.POST,
      sendData
    );

    return response.body;
  },
});