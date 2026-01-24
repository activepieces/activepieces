import { workableAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAccountSubdomain } from '../common/get-subdomain';

export const getJob = createAction({
  auth: workableAuth,
  name: 'getJob',
  displayName: 'Get Job',
  description: 'Gets specific job deatils.',
  props: {
    shortcode: Property.ShortText({
      displayName: "Shortcode",
      description: "Shortcode of specific job",
      required: true
    })
  },
  async run(context) {
    // Action logic here
    const shortcode = context.propsValue?.shortcode;
    const accessToken = context.auth.secret_text;

    // get account subdomain
    const account = await getAccountSubdomain(accessToken);

    const url = `https://${account}.workable.com/spi/v3/jobs/${shortcode}`;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
    
    return response.body;
  },
});
