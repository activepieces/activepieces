import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, HttpRequest, QueryParams, httpClient } from "@activepieces/pieces-common";
import { BEEHIIV_API_URL } from "../common/constants";
import { beehiivAuth } from "../../index";

export const listAutomationsAction = createAction({
  auth: beehiivAuth,
  name: 'list_automations',
  displayName: 'List Automations',
  description: 'Retrieve a list of automations for a publication.',
  props: {
    publicationId: Property.ShortText({
      displayName: 'Publication ID',
      description: 'The ID of the publication.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'A limit on the number of automations to be returned (1-100, default 10).',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'The page number for pagination (default 1).',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const publicationId = propsValue['publicationId'];

    const queryParams: QueryParams = {};
    if (propsValue['limit'] !== undefined) {
      queryParams['limit'] = (propsValue['limit'] as number).toString();
    }
    if (propsValue['page'] !== undefined) {
      queryParams['page'] = (propsValue['page'] as number).toString();
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${BEEHIIV_API_URL}/publications/${publicationId}/automations`,
      headers: {
        'Authorization': `Bearer ${auth}`,
      },
      queryParams: queryParams,
    };

    return await httpClient.sendRequest(request);
  },
});
