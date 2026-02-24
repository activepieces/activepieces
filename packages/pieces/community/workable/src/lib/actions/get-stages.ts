import { workableAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccountSubdomain } from '../common/get-subdomain';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getStages = createAction({
  auth: workableAuth,
  name: 'getStages',
  displayName: 'Get Stages',
  description: 'Gets stages in your recruitment pipeline stages.',
  props: {
    shortcode: Property.ShortText({
      displayName: "Shortcode",
      description: "Shortcode of specific job",
      required: true
    })
  },
  async run(context) {
    // Action logic here
    const shortcode = context.propsValue.shortcode;

    const accessToken = context.auth.secret_text;
    const account = await getAccountSubdomain(accessToken);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${account}.workable.com/spi/v3/jobs/${shortcode}/stages`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    });
    return response.body;
  },
});
