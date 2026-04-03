import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { workdayAuth } from '../common/auth';

export const changeJobDetails = createAction({
  auth: workdayAuth,
  name: 'change_job_details',
  displayName: 'Change Job Details',
  description: 'Initiates and submits a job change event for a worker.',
  props: {
    worker_id: Property.ShortText({
      displayName: 'Worker ID',
      description: 'The Workday Worker ID (WID) of the employee.',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Effective Date',
      description: 'The effective date of the job change (YYYY-MM-DD).',
      required: true,
    }),
    reason_id: Property.ShortText({
      displayName: 'Reason ID',
      description: 'The WID of the job change reason.',
      required: true,
    }),
    job_id: Property.ShortText({
      displayName: 'Position ID',
      description: 'The WID of the position to assign the worker to.',
      required: false,
    }),
    supervisory_organization_id: Property.ShortText({
      displayName: 'Supervisory Organization ID',
      description: 'The WID of the supervisory organization.',
      required: false,
    }),
    location_id: Property.ShortText({
      displayName: 'Location ID',
      description: 'The WID of the location for the job change.',
      required: false,
    }),
    business_title: Property.ShortText({
      displayName: 'Business Title',
      description: 'The business title to assign to the worker.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const { hostname, tenant } = auth.props!;
    const {
      worker_id,
      date,
      reason_id,
      job_id,
      supervisory_organization_id,
      location_id,
      business_title,
    } = context.propsValue;

    const initiateBody: Record<string, unknown> = {
      date,
      reason: { id: reason_id },
    };

    if (job_id) {
      initiateBody['job'] = { id: job_id };
    }
    if (supervisory_organization_id) {
      initiateBody['supervisoryOrganization'] = { id: supervisory_organization_id };
    }
    if (location_id) {
      initiateBody['location'] = { id: location_id };
    }
    if (business_title) {
      initiateBody['businessTitle'] = business_title;
    }

    const initiateResponse = await httpClient.sendRequest<{ id: string }>({
      method: HttpMethod.POST,
      url: `https://${hostname}/ccx/api/staffing/v6/${tenant}/workers/${worker_id}/jobChanges`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: initiateBody,
    });

    const jobChangeId = initiateResponse.body.id;

    const submitResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://${hostname}/ccx/api/staffing/v6/${tenant}/jobChanges/${jobChangeId}/submit`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {},
    });

    return submitResponse.body;
  },
});
