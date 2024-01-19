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
    const body: Record<string, unknown> = { ...context.propsValue };
    delete body['auth'];
    delete body['meeting_id'];

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
