import { createAction } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { RegistrationResponse } from '../common/models';
import { getRegistarantProps } from '../common/props';
import { zoomAuth } from '../..';

export const zoomCreateMeetingRegistrant = createAction({
  auth: zoomAuth,
  name: 'zoom_create_meeting_registrant',
  displayName: 'Create Zoom Meeting Registrant',
  description: "Create and submit a user's registration to a meeting.",
  props: getRegistarantProps(),
  async run(context) {
    const body: Record<string, unknown> = {
      first_name: context.propsValue.first_name,
      last_name: context.propsValue.last_name,
      email: context.propsValue.email,
      address: context.propsValue.address,
      city: context.propsValue.city,
      state: context.propsValue.state,
      zip: context.propsValue.zip,
      country: context.propsValue.country,
      phone: context.propsValue.phone,
      comments: context.propsValue.comments,
      industry: context.propsValue.industry,
      job_title: context.propsValue.job_title,
      no_of_employees: context.propsValue.no_of_employees,
      org: context.propsValue.org,
      purchasing_time_frame: context.propsValue.purchasing_time_frame,
      role_in_purchase_process: context.propsValue.role_in_purchase_process,
    };

    if (
      context.propsValue.custom_questions &&
      Object.keys(context.propsValue.custom_questions).length > 0
    ) {
      body.custom_questions = Object.entries(
        context.propsValue.custom_questions
      ).map(([key, value]) => ({ title: key, value: value }));
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.zoom.us/v2/meetings/${context.propsValue.meeting_id}/registrants`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      queryParams: {},
    };

    const result = await httpClient.sendRequest<RegistrationResponse>(request);
    console.debug('Meeting registration response', result);

    if (result.status === 201) {
      return result.body;
    } else {
      return result;
    }
  },
});
