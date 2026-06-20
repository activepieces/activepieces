import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const getUserAvailabilitySchedules = createAction({
  auth: calendlyAuth,
  name: "get_availability_schedules",
  displayName: "Get User Availability Schedules",
  description:
    "Get availability schedules and date overrides for a Calendly user.",
  props: {
    user_uri: Property.ShortText({
      displayName: "User URI",
      description:
        "Calendly user URI. Leave empty to use the connected account.",
      required: false
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
      path: "/user_availability_schedules",
      queryParams: {
        user: userUri
      }
    });
  }
});
