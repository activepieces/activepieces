import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { CalendlyEventType } from '../common/types';
import { calendlyAuth } from '../auth';

type EventTypeResponse = {
  resource: CalendlyEventType;
};

export const getEmbedWidget = createAction({
  auth: calendlyAuth,
  name: "get_embed_code",
  displayName: "Get Embed Widget Code",
  description:
    "Build Calendly embed HTML for an event type scheduling page. Use this to drop Calendly booking into an external website.",
  props: {
    event_type: calendlyCommon.eventTypeDropdown(),
    embed_type: Property.StaticDropdown({
      displayName: "Embed Type",
      required: true,
      defaultValue: "inline",
      options: {
        disabled: false,
        options: [
          { label: "Inline widget", value: "inline" },
          { label: "Popup widget", value: "popup" },
          { label: "Popup text link", value: "popup_text" }
        ]
      }
    }),
    link_text: Property.ShortText({
      displayName: "Link Text",
      description: "Text shown for popup_text embed type.",
      required: false,
      defaultValue: "Schedule time with me"
    }),
    prefill_name: Property.ShortText({
      displayName: "Prefill Name",
      required: false
    }),
    prefill_email: Property.ShortText({
      displayName: "Prefill Email",
      required: false
    }),
    hide_gdpr_banner: Property.Checkbox({
      displayName: "Hide GDPR Banner",
      required: false,
      defaultValue: false
    }),
    widget_height: Property.Number({
      displayName: "Inline Widget Height (px)",
      required: false,
      defaultValue: 700
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const eventTypeUri = calendlyCommon.resolveEventTypeUri(
      context.propsValue.event_type
    );
    const eventTypeUuid = calendlyCommon.resolveUuid(eventTypeUri);

    const { resource } = await calendlyCommon.apiRequest<EventTypeResponse>({
      token,
      method: HttpMethod.GET,
      path: `/event_types/${eventTypeUuid}`
    });

    const schedulingUrl = new URL(resource.scheduling_url);
    const {
      prefill_name,
      prefill_email,
      hide_gdpr_banner,
      embed_type,
      link_text,
      widget_height
    } = context.propsValue;

    if (prefill_name) {
      schedulingUrl.searchParams.set("name", String(prefill_name));
    }
    if (prefill_email) {
      schedulingUrl.searchParams.set("email", String(prefill_email));
    }
    if (hide_gdpr_banner) {
      schedulingUrl.searchParams.set("hide_gdpr_banner", "1");
    }

    const url = schedulingUrl.toString();
    const scriptTag =
      '<script src="https://assets.calendly.com/assets/external/widget.js" async></script>';

    let embedHtml = "";
    let usageNotes = "";

    switch (embed_type) {
      case "popup":
        embedHtml = `${scriptTag}\n<a href="" onclick="Calendly.initPopupWidget({url: '${url}'});return false;">${link_text ||
          "Schedule time with me"}</a>`;
        usageNotes =
          "Add the script once per page, then place the anchor where you want the booking button.";
        break;
      case "popup_text":
        embedHtml = `${scriptTag}\n<span onclick="Calendly.initPopupWidget({url: '${url}'});" style="cursor:pointer;text-decoration:underline;">${link_text ||
          "Schedule time with me"}</span>`;
        usageNotes = "Text-style popup trigger. Add the script once per page.";
        break;
      case "inline":
      default:
        embedHtml = `<div class="calendly-inline-widget" data-url="${url}" style="min-width:320px;height:${widget_height ||
          700}px;"></div>\n${scriptTag}`;
        usageNotes =
          "Paste the div where the calendar should render. The script can live at the bottom of the page.";
        break;
    }

    return {
      scheduling_url: url,
      event_type_name: resource.name,
      embed_type: embed_type || "inline",
      embed_html: embedHtml,
      usage_notes: usageNotes
    };
  }
});
