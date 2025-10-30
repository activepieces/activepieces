import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { FathomAuth } from "../common/auth";
import { makeRequest, recordingIdDropdown } from "../common/client";

export const getRecordingTranscript = createAction({
  auth: FathomAuth,
  name: "getRecordingTranscript",
  displayName: "Get Recording Transcript",
  description:
    "Fetches the transcript for a specific meeting recording in Fathom. ",
  props: {
    recordingId: recordingIdDropdown,
    destinationUrl: Property.ShortText({
      displayName: "Destination URL ",
      description:
        "If provided, Fathom will POST the transcript to this URL asynchronously.",
      required: false,
    }),
  },

  async run(context) {
    const { recordingId, destinationUrl } = context.propsValue;
    const apiKey = context.auth;

    const query = destinationUrl
      ? `?destination_url=${encodeURIComponent(destinationUrl)}`
      : "";

    const path = `/recordings/${recordingId}/transcript${query}`;

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      path
    );

    if (response.transcript) {
      return {
        mode: "synchronous",
        recordingId,
        transcript: response.transcript,
      };
    } else if (response.destination_url) {
      return {
        mode: "asynchronous",
        recordingId,
        message:
          "Transcript will be sent to your destination URL once ready.",
        destination_url: response.destination_url,
      };
    } else {
      throw new Error("Unexpected response from Fathom API.");
    }
  },
});
