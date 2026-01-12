import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const createEstimateOptionNote = createAction({
  auth: housecallProAuth,
  name: "create_estimate_option_note",
  displayName: "Create estimate option note",
  description: "Create a new estimate option note",
  props: {
    estimate_id: Property.ShortText({ displayName: "Estimate ID", required: true }),
    option_id: Property.ShortText({ displayName: "Option ID", required: true }),
    content: Property.LongText({ displayName: "Content", required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await makeHousecallProRequest(
      auth,
      `/estimates/${propsValue["estimate_id"]}/options/${propsValue["option_id"]}/notes`,
      HttpMethod.POST,
      { content: propsValue["content"] }
    );
    return response.body;
  },
});


