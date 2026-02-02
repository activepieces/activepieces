import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const createEstimateOptionLink = createAction({
  auth: housecallProAuth,
  name: "create_estimate_option_link",
  displayName: "Create estimate option link",
  description: "Create a new estimate option link",
  props: {
    estimate_id: Property.ShortText({ displayName: "Estimate ID", required: true }),
    option_id: Property.ShortText({ displayName: "Option ID", required: true }),
    title: Property.ShortText({ displayName: "Title", required: true }),
    url: Property.ShortText({ displayName: "URL", required: true }),
  },
  async run({ auth, propsValue }) {
    const body = { title: propsValue['title'], url: propsValue['url'] };
    const response = await makeHousecallProRequest(
      auth,
      `/estimates/${propsValue['estimate_id']}/options/${propsValue['option_id']}/links`,
      HttpMethod.POST,
      body
    );
    return response.body;
  },
});


