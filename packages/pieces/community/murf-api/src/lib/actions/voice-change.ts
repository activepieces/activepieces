import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { murfAuth } from '../../index';
import { murfCommon, MURF_API_URL } from '../common/props';
import FormData from 'form-data';

export const voiceChange = createAction({
    auth: murfAuth,
    name: 'voice_change',
    displayName: 'Voice Change',
    description: 'Transform any voice recording with a new voice.',
    props: {
        voiceId: murfCommon.voiceId(true),
        file: Property.File({
            displayName: 'Source Audio File',
            description: 'The audio file to transform. **Use this OR the "Source File URL"**.',
            required: false,
        }),
        fileUrl: Property.ShortText({
            displayName: 'Source File URL',
            description: 'URL of the audio file to transform. **Use this OR the "Source Audio File"**.',
            required: false,
        }),
        format: Property.StaticDropdown({
            displayName: 'Output Format',
            required: false,
            options: {
                options: [
                    { label: 'MP3', value: 'MP3' },
                    { label: 'WAV', value: 'WAV' },
                    { label: 'FLAC', value: 'FLAC' },
                    { label: 'ALAW', value: 'ALAW' },
                    { label: 'ULAW', value: 'ULAW' },
                ],
            },
            defaultValue: 'WAV',
        }),
        pitch: Property.Number({
            displayName: 'Pitch',
            description: 'Adjusts the pitch of the voiceover (from -50 to 50).',
            required: false,
        }),
        rate: Property.Number({
            displayName: 'Speed',
            description: 'Adjusts the speed of the voiceover (from -50 to 50).',
            required: false,
        }),
        encodeOutputAsBase64: Property.Checkbox({
            displayName: 'Encode Output as Base64',
            description: 'Set to true to receive audio in the response as a Base64 encoded string.',
            required: false,
        })
    },
    async run({ auth, propsValue }) {
        const { voiceId, file, fileUrl, format, pitch, rate, encodeOutputAsBase64 } = propsValue as {
            voiceId: string;
            file?: ApFile; // Use ApFile for the type
            fileUrl?: string;
            format?: string;
            pitch?: number;
            rate?: number;
            encodeOutputAsBase64?: boolean;
        };

        if (!file && !fileUrl) {
            throw new Error("Either 'Source Audio File' or 'Source File URL' must be provided.");
        }
        if (file && fileUrl) {
            throw new Error("Please provide either 'Source Audio File' or 'Source File URL', not both.");
        }

        const formData = new FormData();
        formData.append('voice_id', voiceId);

        if (fileUrl) {
            formData.append('file_url', fileUrl);
        }
        if (file) {
            const fileBuffer = Buffer.from(file.base64, 'base64');
            formData.append('file', fileBuffer, file.filename);
        }
        if (format) formData.append('format', format);
        if (pitch) formData.append('pitch', pitch.toString());
        if (rate) formData.append('rate', rate.toString());
        if (encodeOutputAsBase64) formData.append('encode_output_as_base64', String(encodeOutputAsBase64));

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${MURF_API_URL}/voice-changer/convert`,
            body: formData,
            headers: {
                ...formData.getHeaders(),
                'api-key': auth,
            },
            // The 'authentication' property is removed here
        });

        return response.body;
    },
});