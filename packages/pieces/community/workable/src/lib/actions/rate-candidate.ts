import { workableAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccountSubdomain } from '../common/get-subdomain';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const rateCandidate = createAction({
  auth: workableAuth,
  name: 'rateCandidate',
  displayName: 'Rate candidate',
  description: 'Rates the candidate on workable.',
  props: {
    id: Property.ShortText({
      displayName: "Candidate's Id",
      description: "Id of candidate",
      required: true
    }),
    member_id: Property.ShortText({
      displayName: "Member's Id",
      description: "Id of member that is adding the rating",
      required: true
    }),
    comment: Property.LongText({
      displayName: "Comment",
      description: "Comment about the scoring of the candidate",
      required: true
    }),
    scale: Property.StaticDropdown({
      displayName: "Rating scale",
      description: "Select scale to rate candidate on",
      required: true,
      options: {
        options: [
          {label: "Thumbs", value: "thumbs"},
          {label: "Stars", value: "stars"},
          {label: "Numbers", value: "numbers"}
        ]
      }
    }),
    grade: Property.Number({
      displayName: "Grade",
      description: "Thumbs scale: 0-2, Stars scale: 0-4, Numbers scale: 0-9",
      required: true
    })
  },
  async run(context) {
    // Action logic here
    const id = context.propsValue.id;
    const member_id = context.propsValue.member_id;
    const comment = context.propsValue.comment;
    const scale = context.propsValue.scale;
    const grade = context.propsValue.grade;

    const accessToken = context.auth.secret_text;
    const subdomain = await getAccountSubdomain(accessToken);

    const body: Record<string, any> = {
      comment,
      scale,
      member_id,
      grade
    };
    

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://${subdomain}.workable.com/spi/v3/candidates/${id}/ratings`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      },
      body: body

    })
    return response;
  },
});
