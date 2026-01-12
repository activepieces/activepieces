import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const createJob = createAction({
  auth: housecallProAuth,
  name: 'create_job',
  displayName: 'Create Job',
  description: 'Creates a job with the ID for an already existing address and customer.',
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The ID of the customer this job is for',
      required: true,
    }),
    address_id: Property.ShortText({
      displayName: 'Address ID',
      description: 'The ID of the address for this job',
      required: true,
    }),
    invoice_number: Property.Number({
      displayName: 'Invoice Number',
      description: 'Invoice number must be unique across all of a company\'s jobs. If left blank, one will be automatically generated.',
      required: false,
    }),
    scheduled_start: Property.DateTime({
      displayName: 'Scheduled Start',
      description: 'Start time of job in ISO8601 format (e.g., 2021-01-14T20:14:00)',
      required: false,
    }),
    scheduled_end: Property.DateTime({
      displayName: 'Scheduled End',
      description: 'End time of job in ISO8601 format (e.g., 2021-01-14T21:14:00)',
      required: false,
    }),
    arrival_window: Property.Number({
      displayName: 'Arrival Window (minutes)',
      description: 'Integer value in minutes of arrival window',
      required: false,
    }),
    assigned_employee_ids: Property.Array({
      displayName: 'Assigned Employee IDs',
      description: 'Array of employee IDs to assign to the job',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags to assign to the job',
      required: false,
    }),
    lead_source: Property.ShortText({
      displayName: 'Lead Source',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    line_items: Property.Array({
      displayName: 'Line Items',
      description: 'Array of line items for the job',
      required: false,
    }),
    pricing_form: Property.Json({
      displayName: 'Pricing Form',
      description: 'Pricing form object with fields and options (use UUIDs from GET price form endpoint)',
      required: false,
    }),
    job_fields: Property.Json({
      displayName: 'Job Fields',
      description: 'Job fields object (e.g., job_type_id, business_unit_id)',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const jobData: Record<string, any> = {
      customer_id: propsValue['customer_id'],
      address_id: propsValue['address_id'],
    };

    if (propsValue['invoice_number'] !== undefined) {
      jobData['invoice_number'] = propsValue['invoice_number'];
    }

    // Build schedule object if any schedule fields are provided
    if (propsValue['scheduled_start'] || propsValue['scheduled_end'] || propsValue['arrival_window'] !== undefined) {
      jobData['schedule'] = {};
      if (propsValue['scheduled_start']) {
        jobData['schedule']['scheduled_start'] = propsValue['scheduled_start'];
      }
      if (propsValue['scheduled_end']) {
        jobData['schedule']['scheduled_end'] = propsValue['scheduled_end'];
      }
      if (propsValue['arrival_window'] !== undefined) {
        jobData['schedule']['arrival_window'] = propsValue['arrival_window'];
      }
    }

    if (propsValue['assigned_employee_ids'] && propsValue['assigned_employee_ids'].length > 0) {
      jobData['assigned_employee_ids'] = propsValue['assigned_employee_ids'] as string[];
    }
    if (propsValue['tags'] && propsValue['tags'].length > 0) {
      jobData['tags'] = propsValue['tags'] as string[];
    }
    if (propsValue['lead_source']) {
      jobData['lead_source'] = propsValue['lead_source'];
    }
    if (propsValue['notes']) {
      jobData['notes'] = propsValue['notes'];
    }
    if (propsValue['line_items']) {
      jobData['line_items'] = propsValue['line_items'];
    }
    if (propsValue['pricing_form']) {
      jobData['pricing_form'] = propsValue['pricing_form'];
    }
    if (propsValue['job_fields']) {
      jobData['job_fields'] = propsValue['job_fields'];
    }

    const response = await makeHousecallProRequest(
      auth,
      '/jobs',
      HttpMethod.POST,
      jobData
    );

    return response.body;
  },
});
