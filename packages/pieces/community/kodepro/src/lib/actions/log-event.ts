import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { kodeProAuth, makeKodeProRequest, KodeProAuth } from "../common";

export const logEvent = createAction({
  auth: kodeProAuth,
  name: "log_event",
  displayName: "Log Event",
  description: "Log a monitoring event to the Kode Pro dashboard.",
  props: {
    event_type: Property.ShortText({
      displayName: "Event Type",
      description: "A dot-namespaced event identifier (e.g. sync.contact.completed)",
      required: true,
    }),
    message: Property.LongText({
      displayName: "Message",
      description: "Human-readable description of the event",
      required: true,
    }),
    severity: Property.StaticDropdown({
      displayName: "Severity",
      description: "The severity level of the event",
      required: false,
      options: {
        options: [
          { label: "Info", value: "info" },
          { label: "Warning", value: "warning" },
          { label: "Emergency", value: "emergency" },
        ],
      },
    }),
    metadata: Property.Object({
      displayName: "Metadata",
      description: "Additional context for the event",
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      event_type: propsValue["event_type"],
      message: propsValue["message"],
    };

    if (propsValue["severity"]) body["severity"] = propsValue["severity"];
    if (propsValue["metadata"]) body["metadata"] = propsValue["metadata"];

    const response = await makeKodeProRequest(
      auth as unknown as KodeProAuth,
      "/monitor/events",
      HttpMethod.POST,
      body
    );

    return response.body;
  },
});
