import { createAction } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const listEventTypes = createAction({
  auth: calendlyAuth,
  name: "list_event_types",
  displayName: "List Event Types",
  description: "List active Calendly event types for the connected user.",
  props: {},
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const collection = await calendlyCommon.fetchEventTypes(token);
    return { collection };
  }
});
