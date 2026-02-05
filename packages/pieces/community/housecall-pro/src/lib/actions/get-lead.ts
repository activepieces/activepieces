import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getLead = createAction({
  auth: housecallProAuth,
  name: "get_lead",
  displayName: "Get Lead",
  description: "Get the lead via ID.",
  props: {
    id: Property.ShortText({
      displayName: "Lead ID",
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await makeHousecallProRequest(
      auth,
      `/leads/${propsValue['id']}`,
      HttpMethod.GET
    );

    return response.body;
  },
});
