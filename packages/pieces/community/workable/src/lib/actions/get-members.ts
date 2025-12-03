import { workableAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccountSubdomain } from '../common/get-subdomain';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getMembers = createAction({
  auth: workableAuth,
  name: 'getMembers',
  displayName: 'Get Members',
  description: 'Gets members of hiring team.',
  props: {
    limit: Property.Number({
      displayName: "Limit",
      description: "Default is 50",
      required: false
    }),
    role: Property.ShortText({
      displayName: "Role",
      description: "Filter for member of specified role",
      required: false
    }),
    shortcode: Property.ShortText({
      displayName: "Shortcode",
      description: "Shortcode of specific job",
      required: false
    }),
    email: Property.ShortText({
      displayName: "Member's email",
      description: "Filter for specific member by email",
      required: false
    }),
    name: Property.ShortText({
      displayName: "Member's name",
      description: "Filter for members of specified name (Exact Match)",
      required: false
    }),
  },
  async run(context) {
    // Action logic here
    const limit = context.propsValue['limit'];
    const role = context.propsValue['role'];
    const shortcode = context.propsValue['shortcode'];
    const email = context.propsValue['email'];
    const name = context.propsValue['name'];

    const accessToken = context.auth.secret_text;

    const queryParams: Record<string, any> = {};

    if(limit !== undefined && limit !== null) {
      queryParams["limit"] = limit;
    }
    if(role && role.trim() !== ''){
      queryParams["role"] = role;
    }
    if(shortcode && shortcode.trim() !== ""){
      queryParams["shortcode"] = shortcode;
    }
    if(email && email.trim() !== ""){
      queryParams["email"] = email;
    }
    if(name && name.trim() !== ''){
      queryParams["name"] = name;
    }

    const subdomain = await getAccountSubdomain(accessToken);
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${subdomain}.workable.com/spi/v3/members`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      },
      queryParams
    })

    return response.body;
  },
});
