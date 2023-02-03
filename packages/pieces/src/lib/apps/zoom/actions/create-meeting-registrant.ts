import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { MeetingRegistrant, RegistrationResponse } from "../common/models";
import { getRegistarantProps } from "../common/props";

export const zoomCreateMeetingRegistrant = createAction({
  name: 'zoom_create_meeting_registrant',
  displayName: 'Create Zoom Meeting Registrant',
  description: "Create and submit a user's registration to a meeting.",
  props: getRegistarantProps(),
  sampleData: {
    "first_name": "Jill",
    "last_name": "Chill",
    "email": "jchill@example.com",
    "address": "1800 Amphibious Blvd.",
    "city": "Mountain View",
    "state": "CA",
    "zip": "94045",
    "country": "US",
    "phone": "5550100",
    "comments": "Looking forward to the discussion.",
    "custom_questions": [
      {
        "title": "What do you hope to learn from this?",
        "value": "Look forward to learning how you come up with new recipes and what other services you offer."
      }
    ],
    "industry": "Food",
    "job_title": "Chef",
    "no_of_employees": "1-20",
    "org": "Cooking Org",
    "purchasing_time_frame": "1-3 months",
    "role_in_purchase_process": "Influencer",
    "language": "en-US",
    "auto_approve": true
  },

  async run(context) {
    const body = {
      ...context.propsValue
    }
    delete body['authentication']
    delete body['meeting_id']

    const request: HttpRequest<MeetingRegistrant> = {
      method: HttpMethod.POST,
      url: `https://api.zoom.us/v2/meetings/${context.propsValue.meeting_id}/registrants`,
      body: body as MeetingRegistrant,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.authentication!.access_token
      },
      queryParams: {}
    }

    const result = await httpClient.sendRequest<RegistrationResponse>(request)
    console.debug("Meeting registration response", result)

    if (result.status === 201) {
      return result.body;
    } else {
      return result;
    }
  }
})