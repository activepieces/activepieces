import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "../common";
import { kommoAuth } from "../../index";

export const findCompanyAction = createAction({
  auth: kommoAuth,
  name: 'find_company',
  displayName: 'Find Company',
  description: 'Find companies by name (full or partial).',
  props: {
    companyName: Property.ShortText({
      displayName: 'Company Name',
      required: true,
    })
  },
  async run(context) {
    const { companyName } = context.propsValue;
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.GET,
      `/companies?query=${encodeURIComponent(companyName)}`
    );

    return result._embedded?.companies || [];
  },
});
