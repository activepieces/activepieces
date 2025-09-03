
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { newNote } from "./lib/triggers/new-note";
import { createCall } from "./lib/actions/create-call";
import { getMeetingTranscription } from "./lib/actions/get-meeting-transcription";
import { getMeetingRecording } from "./lib/actions/get-meeting-recording";
import { newMeetingScheduled } from "./lib/triggers/new-meeting-scheduled";
import { meetingRescheduled } from "./lib/triggers/meeting-rescheduled";
import { meetingCancelled } from "./lib/triggers/meeting-cancelled";

    export const avoma = createPiece({
      displayName: 'Avoma',
      description:
        'Avoma is an AI Meeting Assistant that automatically records, transcribes, and summarizes your meetings.',
      auth: PieceAuth.SecretText({
        displayName: 'API Key',
        description:
          'Your Avoma API Key (Bearer token). Generate it from your Avoma API Integration settings: https://help.avoma.com/api-integration-for-avoma',
        required: true
      }),
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/avoma.png',
      authors: ["fortunamide", "onyedikachi-david"],
      actions: [createCall, getMeetingRecording, getMeetingTranscription],
      triggers: [newNote, newMeetingScheduled, meetingRescheduled, meetingCancelled]
    });
    