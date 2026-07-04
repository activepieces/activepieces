import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const deleteEstimateOptionNote = createAction({
  auth: housecallProAuth,
  name: "delete_estimate_option_note",
  displayName: "Delete estimate option note",
  description: "Delete a specific estimate option note",
  audience: 'both',
  aiMetadata: { description: "Delete a single note from an estimate option, identified by estimate ID, option ID, and note ID. Idempotent: deleting an already-removed note has no further effect.", idempotent: true },
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


