import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const getSchedulingPageLink = createAction({
  auth: calendlyAuth,
  name: "get_scheduling_link",
  displayName: "Get Scheduling Page Link",
  description:
    "Get the public scheduling URL for an event type or the user's main booking page.",
  props: {
    event_type: calendlyCommon.eventTypeDropdown(),
    include_embed_snippet: Property.Checkbox({
      displayName: "Include Inline Embed Snippet",
      description:
        "Also return a minimal inline embed HTML block for this scheduling URL.",
      required: false,
      defaultValue: false
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const eventTypeUri = calendlyCommon.resolveEventTypeUri(
      context.propsValue.event_type
    );
    const eventTypeUuid = calendlyCommon.resolveUuid(eventTypeUri);

    const response = await calendlyCommon.apiRequest<{
      resource: { name: string; scheduling_url: string; duration: number };
    }>({
      token,
      method: HttpMethod.GET,
      path: `/event_types/${eventTypeUuid}`
    });

    const schedulingUrl = response.resource.scheduling_url;
    const result: Record<string, unknown> = {
      event_type_name: response.resource.name,
      duration_minutes: response.resource.duration,
      scheduling_url: schedulingUrl
    };

    if (context.propsValue.include_embed_snippet) {
      result.embed_html = `<div class="calendly-inline-widget" data-url="${schedulingUrl}" style="min-width:320px;height:700px;"></div>\n<script src="https://assets.calendly.com/assets/external/widget.js" async></script>`;
    }

    return result;
  }
});
