import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const getUserBusyTimes = createAction({
  auth: calendlyAuth,
  name: "get_busy_times",
  displayName: "Get User Busy Times",
  description:
    "List busy/blocked times for a user from connected calendars. Range must be in the future and max 7 days.",
  props: {
    user_uri: Property.ShortText({
      displayName: "User URI",
      description:
        "Calendly user URI. Leave empty to use the connected account.",
      required: false
    }),
    start_time: Property.DateTime({
      displayName: "Range Start",
      description: "Start of the range (UTC, must be in the future).",
      required: true
    }),
    end_time: Property.DateTime({
      displayName: "Range End",
      description: "End of the range (UTC, max 7 days after start).",
      required: true
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const user = await calendlyCommon.getUser(token);
    const userUri =
      (context.propsValue.user_uri as string | undefined)?.trim() || user.uri;

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.GET,
      path: "/user_busy_times",
      queryParams: {
        user: userUri,
        start_time: new Date(
          context.propsValue.start_time as string
        ).toISOString(),
        end_time: new Date(context.propsValue.end_time as string).toISOString()
      }
    });
  }
});
