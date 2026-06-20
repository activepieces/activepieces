import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const getRoutingFormSubmission = createAction({
  auth: calendlyAuth,
  name: "get_form_submission",
  displayName: "Get Routing Form Submission",
  description:
    "Get a single routing form submission with answers. Requires Calendly Teams plan.",
  props: {
    submission_uuid: Property.ShortText({
      displayName: "Submission UUID or URI",
      required: true
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const submissionUuid = calendlyCommon.resolveUuid(
      context.propsValue.submission_uuid
    );

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.GET,
      path: `/routing_form_submissions/${submissionUuid}`
    });
  }
});
