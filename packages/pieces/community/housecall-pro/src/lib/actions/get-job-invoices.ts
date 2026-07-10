import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getJobInvoices = createAction({
  auth: housecallProAuth,
  name: "get_job_invoices",
  displayName: "Get Job Invoices",
  description: "Lists all invoices for a job",
  audience: 'both',
  aiMetadata: { description: 'Read-only: returns the invoices attached to a Housecall Pro job, given a job ID. Use to inspect billing/invoice records for a known job before reading or reconciling them; safe to retry. Requires the job_id; does not create or modify invoices.', idempotent: true },
  props: {
    job_id: Property.ShortText({
      displayName: "Job ID",
      description: "The ID of the job to retrieve invoices for",
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await makeHousecallProRequest(
      auth,
      `/jobs/${propsValue['job_id']}/invoices`,
      HttpMethod.GET
    );

    return response.body;
  },
});
