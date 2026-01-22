import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const lockJobs = createAction({
  auth: housecallProAuth,
  name: "lock_jobs",
  displayName: "Lock Jobs",
  description: "Lock completed or scheduled jobs by the given time range",
  props: {
    starting_at: Property.DateTime({
      displayName: "Starting At",
      description: "Lock jobs starting from this date/time",
      required: true,
    }),
    ending_at: Property.DateTime({
      displayName: "Ending At",
      description: "Lock jobs until this date/time",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      starting_at: propsValue['starting_at'],
      ending_at: propsValue['ending_at'],
    };

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/lock`,
      HttpMethod.POST,
      body
    );

    return response.body;
  },
});
