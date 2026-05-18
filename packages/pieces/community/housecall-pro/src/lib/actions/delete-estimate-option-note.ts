import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const deleteEstimateOptionNote = createAction({
  auth: housecallProAuth,
  name: "delete_estimate_option_note",
  displayName: "Delete estimate option note",
  description: "Delete a specific estimate option note",
  props: {
    estimate_id: Property.ShortText({ displayName: "Estimate ID", required: true }),
    option_id: Property.ShortText({ displayName: "Option ID", required: true }),
    note_id: Property.ShortText({ displayName: "Note ID", required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await makeHousecallProRequest(
      auth,
      `/estimates/${propsValue["estimate_id"]}/options/${propsValue["option_id"]}/notes/${propsValue["note_id"]}`,
      HttpMethod.DELETE
    );
    return response.body;
  },
});


