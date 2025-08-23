import { createAction, Property } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';

export const mailChimpGetCampaignReport = createAction({
  auth: mailchimpAuth,
  name: 'get-campaign-report',
  displayName: 'Get Campaign Report',
  description: 'Retrieves engagement metrics for a campaign.',
  props: {
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      required: true,
    }),
  },
  async run(ctx) {
    const token = getAccessTokenOrThrow(ctx.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    const resp = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${server}.api.mailchimp.com/3.0/reports/${ctx.propsValue.campaign_id}`,
      headers: { Authorization: `OAuth ${token}` },
    });

    return resp.body;
  },
});
