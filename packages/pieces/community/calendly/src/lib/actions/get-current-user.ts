import { createAction } from "@activepieces/pieces-framework";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const getCurrentUser = createAction({
  auth: calendlyAuth,
  name: "get_me",
  displayName: "Get Current User",
  description:
    "Get the connected Calendly user profile, including organization URI.",
  props: {},
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const resource = await calendlyCommon.getUser(token);
    return { resource };
  }
});
