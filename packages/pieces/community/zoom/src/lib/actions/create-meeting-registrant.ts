import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { getRegistarantProps } from '../common/props';
import { zoomClient } from '../common/client';
import { createRegistrantOutputSchema } from '../output-schemas';
import { zoomAuth } from '../..';

export const zoomCreateMeetingRegistrant = createAction({
  auth: zoomAuth,
  name: 'zoom_create_meeting_registrant',
  classification: 'WRITE',
  displayName: 'Create Zoom Meeting Registrant',
  description: "Create and submit a user's registration to a meeting.",
  audience: 'both',
  aiMetadata: { description: 'Registers an attendee for an existing Zoom meeting identified by its meeting ID, capturing their name, email, and optional profile/custom-question fields. Use to add a participant to a meeting that has registration enabled. Each call submits a new registration, so it is not idempotent.', idempotent: false },
  outputSchema: createRegistrantOutputSchema,
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

    const meetingId = zoomClient.normalizeMeetingId(context.propsValue.meeting_id);
    return zoomClient.requestObject({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      path: `/meetings/${meetingId}/registrants`,
      body,
      scope: 'meeting:write:registrant',
    });
  },
});
