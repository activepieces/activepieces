import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const getRoutingForm = createAction({
  auth: calendlyAuth,
  name: "get_routing_form",
  displayName: "Get Routing Form",
  description:
    "Get a routing form by UUID or URI. Requires Calendly Teams plan.",
  props: {
    routing_form_uuid: Property.ShortText({
      displayName: "Routing Form UUID or URI",
      required: true
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const formUuid = calendlyCommon.resolveUuid(
      context.propsValue.routing_form_uuid
    );

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.GET,
      path: `/routing_forms/${formUuid}`
    });
  }
});
