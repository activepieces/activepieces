import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { FathomAuth } from "../common/auth";
import { makeRequest, recordingIdDropdown } from "../common/client";

export const getRecordingSummary = createAction({
  auth: FathomAuth,
  name: "getRecordingSummary",
  displayName: "Get Recording Summary",
  description:
    "Fetches the AI-generated summary for a specific meeting recording in Fathom.",
  props: {
    recordingId: recordingIdDropdown,
    destinationUrl: Property.ShortText({
      displayName: "Destination URL (Optional)",
      description:
        "If provided, Fathom will POST the summary to this URL asynchronously.",
      required: false,
    }),
  },

  async run(context) {
    const { recordingId, destinationUrl } = context.propsValue;
    const apiKey = context.auth;

    const query = destinationUrl
      ? `?destination_url=${encodeURIComponent(destinationUrl)}`
      : "";

    const path = `/recordings/${recordingId}/summary${query}`;

    const response = await makeRequest(apiKey, HttpMethod.GET, path);
       console.log("Fathom API response:", response);
    if (response.summary) {
      return {
        summary: response.summary,
      };
    } else if (response.destination_url) {
      return {
        message:
          "Summary will be sent to your destination URL once ready.",
        destination_url: response.destination_url,
      };
    } else {
      throw new Error("Summary is null.");
    }
  },
});
