import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest, HousecallProJob } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const createJob = createAction({
  auth: housecallProAuth,
  name: 'create_job',
  displayName: 'Create Job',
  description: 'Create a new job in Housecall Pro.',
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'The ID of the customer this job is for',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    work_status: Property.StaticDropdown({
      displayName: 'Work Status',
      required: false,
      options: {
        options: [
          { label: 'New', value: 'new' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
      },
    }),
    scheduled_date: Property.DateTime({
      displayName: 'Scheduled Date & Time',
      description: 'When the job is scheduled (ISO 8601 format)',
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration (minutes)',
      description: 'Estimated duration of the job in minutes',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Job Address',
      description: 'Address where the job will be performed',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP Code',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const jobData: Partial<HousecallProJob> = {
      customer_id: propsValue.customer_id,
      title: propsValue.title,
      description: propsValue.description,
      work_status: propsValue.work_status,
      scheduled_date: propsValue.scheduled_date,
      duration: propsValue.duration,
      address: propsValue.address,
      city: propsValue.city,
      state: propsValue.state,
      zip: propsValue.zip,
      notes: propsValue.notes,
    };

    // Remove undefined values
    const cleanJobData: Partial<HousecallProJob> = {};
    (Object.keys(jobData) as Array<keyof typeof jobData>).forEach(key => {
      if (jobData[key] !== undefined && jobData[key] !== null) {
        (cleanJobData as any)[key] = jobData[key];
      }
    });

    const response = await makeHousecallProRequest(
      auth,
      '/jobs',
      HttpMethod.POST,
      cleanJobData
    );

    return response.body;
  },
});
