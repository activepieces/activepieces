import { Property, createAction } from "@activepieces/pieces-framework";
import { callFirefliesApi } from "../common";
import { firefliesAiAuth } from "../../index";

interface AttendeeInput {
    displayName?: string;
    email?: string;
    phoneNumber?: string;
}

interface AudioUploadInput {
    url: string;
    title?: string;
    webhook?: string;
    custom_language?: string;
    save_video?: boolean;
    attendees?: AttendeeInput[];
    client_reference_id?: string;
}

interface UploadAudioResponse {
    uploadAudio: {
        success: boolean;
        title?: string;
        message: string;
    };
}

export const uploadAudioAction = createAction({
    name: 'upload_audio',
    displayName: 'Upload Audio',
    description: 'Upload an audio file to Fireflies for transcription via a public URL.',
    auth: firefliesAiAuth,
    props: {
        audioUrl: Property.ShortText({
            displayName: 'Audio File URL',
            description: 'Publicly accessible HTTPS URL of the media file (mp3, mp4, wav, m4a, ogg).',
            required: true,
        }),
        title: Property.ShortText({
            displayName: 'Title (Optional)',
            description: 'Title or name of the meeting for the transcribed file.',
            required: false,
        }),
        webhookUrl: Property.ShortText({
            displayName: 'Webhook URL (Optional)',
            description: 'URL to receive notifications when transcription completes.',
            required: false,
        }),
        customLanguage: Property.ShortText({
            displayName: 'Custom Language Code (Optional)',
            description: 'E.g., \'es\' for Spanish, \'de\' for German. See Fireflies docs for language codes.',
            required: false,
        }),
        saveVideo: Property.Checkbox({
            displayName: 'Save Video (Optional)',
            description: 'Specify whether the video (if applicable) should be saved.',
            required: false,
        }),
        attendees: Property.Array({
            displayName: 'Attendees (Optional)',
            description: 'Array of meeting attendees (displayName, email, phoneNumber).',
            required: false,
            properties: {
                displayName: Property.ShortText({
                    displayName: 'Display Name',
                    required: false,
                }),
                email: Property.ShortText({
                    displayName: 'Email',
                    required: false,
                }),
                phoneNumber: Property.ShortText({
                    displayName: 'Phone Number',
                    required: false,
                }),
            }
        }),
        clientReferenceId: Property.ShortText({
            displayName: 'Client Reference ID (Optional)',
            description: 'Custom identifier for your uploads, useful for webhook events.',
            required: false,
        }),
    },
    async run(context) {
        const apiKey = context.auth as string;
        const {
            audioUrl,
            title,
            webhookUrl,
            customLanguage,
            saveVideo,
            attendees,
            clientReferenceId,
        } = context.propsValue;

        const input: AudioUploadInput = {
            url: audioUrl,
        };

        if (title) input.title = title;
        if (webhookUrl) input.webhook = webhookUrl;
        if (customLanguage) input.custom_language = customLanguage;
        if (saveVideo !== undefined) input.save_video = saveVideo; // Check for undefined as it's a boolean
        if (attendees && attendees.length > 0) {
            // Ensure attendees are correctly formatted if Property.Array returns objects with mixed casing or extra props
            input.attendees = (attendees as unknown as AttendeeInput[]).map(att => ({
                displayName: att.displayName,
                email: att.email,
                phoneNumber: att.phoneNumber,
            }));
        }
        if (clientReferenceId) input.client_reference_id = clientReferenceId;

        const mutation = `
            mutation UploadAudio($input: AudioUploadInput!) {
                uploadAudio(input: $input) {
                    success
                    title
                    message
                }
            }
        `;

        const variables = { input };

        return await callFirefliesApi<UploadAudioResponse>(apiKey, mutation, variables);
    },
});
