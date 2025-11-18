import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const convertLeadToEstimateOrJob = createAction({
  auth: housecallProAuth,
  name: "convert_lead_to_estimate_or_job",
  displayName: "Convert Lead to Estimate or Job",
  description: "Converts a lead into an estimate or job.",
  props: {
    id: Property.ShortText({
      displayName: "Lead ID",
      required: true,
    }),
    type: Property.ShortText({
      displayName: "Type",
      description: "The type to convert the lead to. Must be either 'estimate' or 'job'",
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const bodyData: Record<string, any> = {
      type: propsValue['type'],
    };

    const response = await makeHousecallProRequest(
      auth,
      `/leads/${propsValue['id']}/convert`,
      HttpMethod.POST,
      bodyData
    );

    return response.body;
  },
});
