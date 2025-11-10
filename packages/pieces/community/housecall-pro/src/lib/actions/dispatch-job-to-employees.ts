import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const dispatchJobToEmployees = createAction({
  auth: housecallProAuth,
  name: "dispatch_job_to_employees",
  displayName: "Dispatch job to employees",
  description: "Dispatch a job to employees",
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job to dispatch",
      required: true,
    }),
    dispatched_employees: Property.Array({
      displayName: "Dispatched Employees",
      description: "Array of employees with employee_id to dispatch to",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      dispatched_employees: propsValue['dispatched_employees'],
    };

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/dispatch`,
      HttpMethod.PUT,
      body
    );

    return response.body;
  },
});
