import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { RegistrationResponse } from "../common/models";
import { getRegistarantProps } from "../common/props";

export const zoomCreateMeetingRegistrant = createAction({
  name: 'zoom_create_meeting_registrant',
  displayName: 'Create Zoom Meeting Registrant',
  description: "Create and submit a user's registration to a meeting.",
  props: getRegistarantProps(),
  sampleData: {
    "id": 85746065,
    "join_url": "https://example.com/j/11111",
    "registrant_id": "fdgsfh2ey82fuh",
    "start_time": "2021-07-13T21:44:51Z",
    "topic": "My Meeting",
    "occurrences": [
      {
        "duration": 60,
        "occurrence_id": "1648194360000",
        "start_time": "2022-03-25T07:46:00Z",
        "status": "available"
      }
    ],
    "participant_pin_code": 380303
  },

  async run(context) {
    const body: Record<string, unknown> = { ...context.propsValue }
    delete body['authentication']
    delete body['meeting_id']

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.zoom.us/v2/meetings/${context.propsValue.meeting_id}/registrants`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.authentication.access_token
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