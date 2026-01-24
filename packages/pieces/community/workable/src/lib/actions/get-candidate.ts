import { workableAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccountSubdomain } from '../common/get-subdomain';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getCandidate = createAction({
  auth: workableAuth,
  name: 'getCandidate',
  displayName: 'Get Candidate',
  description: "Gets candidate's information.",
  props: {
    id: Property.ShortText({
      displayName: "Candidate's Id",
      required: true
    })
  },
  async run(context) {
    // Action logic here
    const candidateId = context.propsValue.id;
    const accessToken = context.auth.secret_text;
    const account = await getAccountSubdomain(accessToken);

    //get candidate information
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${account}.workable.com/spi/v3/candidates/${candidateId}`,
      headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
      },
    });

    return response.body;
  },
});
