import { workableAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccountSubdomain } from '../common/get-subdomain';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const moveCandidate = createAction({
  auth: workableAuth,
  name: 'moveCandidate',
  displayName: 'Move Candidate',
  description: 'Moves candidate to the specified stage.',
  props: {
    id: Property.ShortText({
      displayName: "Candidate's Id",
      description: "Id of candidate",
      required: true
    }),
    member_id: Property.ShortText({
      displayName: "Member's Id",
      description: "This person's Id is used to move the candidate to the next stage",
      required: true
    }),
    target_stage: Property.ShortText({
      displayName: "Target stage name",
      description: "Slug of stage target should be moved to",
      required: true
    })
  },
  async run(context) {
    // Action logic here
    const id = context.propsValue.id;
    const member_id = context.propsValue.member_id;
    const target_stage = context.propsValue.target_stage;

    const accessToken = context.auth.secret_text;
    const subdomain = await getAccountSubdomain(accessToken);

    const payload: Record<string, any> = {
      member_id: member_id,
      target_stage: target_stage
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://${subdomain}.workable.com/spi/v3/candidates/${id}/move`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      },
      body: payload
    })
    
    return response;
  },
});
