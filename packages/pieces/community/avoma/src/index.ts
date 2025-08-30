import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

import { createCall } from "./lib/actions/create-call";
import { getMeetingRecording } from "./lib/actions/get-meeting-recording";
import { getMeetingTranscription } from "./lib/actions/get-meeting-transcription";
import { newNote } from "./lib/triggers/new-note";
import { newMeetingScheduled } from "./lib/triggers/new-meeting-scheduled";
import { meetingRescheduled } from "./lib/triggers/meeting-rescheduled";
import { meetingCancelled } from "./lib/triggers/meeting-cancelled";

// NOTE: Please verify the base API URL from the Avoma documentation.
export const avomaApiUrl = "https://api.avoma.com";

export const avomaAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'Please enter your Avoma API key. You can generate one from your Avoma account by following this guide: https://help.avoma.com/api-integration-for-avoma',
    required: true,
    validate: async ({ auth }) => {
        try {
            // NOTE: Please verify this is a valid endpoint to test the API key.
            // A common endpoint is one that gets user information, like "/v1/profile" or "/v1/me".
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${avomaApiUrl}/v1/profile`,
                headers: {
                    Authorization: `Bearer ${auth}`,
                },
            });
            return {
                valid: true,
            };
        } catch (error) {
            return {
                valid: false,
                error: 'Invalid API Key.',
            };
        }
    },
});

export const avoma = createPiece({
    displayName: "Avoma",
    auth: avomaAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/avoma.png",
    authors: [
    ],
    actions: [
      createCall,
      getMeetingRecording,
      getMeetingTranscription,
    ],
    triggers: [
      newNote,
      newMeetingScheduled,
      meetingRescheduled,
      meetingCancelled
    ],
});