import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { murfAuth } from '../../index';
import { murfCommon, MURF_API_URL } from '../common/props';

export const textToSpeech = createAction({
    auth: murfAuth,
    name: 'text_to_speech',
    displayName: 'Text to Speech',
    description: 'Converts input text into audio.',
    props: {
        text: Property.LongText({
            displayName: 'Text',
            description: 'The text to be synthesized. For example: "Hello there [pause 1s] friend"',
            required: true,
        }),
        voiceId: murfCommon.voiceId(true),
        style: murfCommon.style(false),
        format: Property.StaticDropdown({
            displayName: 'Audio Format',
            description: 'Format of the generated audio file.',
            required: false,
            options: {
                options: [
                    { label: 'MP3', value: 'MP3' },
                    { label: 'WAV', value: 'WAV' },
                    { label: 'FLAC', value: 'FLAC' },
                ],
            },
            defaultValue: 'MP3',
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
    },
    async run({ auth, propsValue }) {
        
        const { text, voiceId, style, format, pitch, rate } = propsValue as {
            text: string;
            voiceId: string;
            style?: string;
            format?: string;
            pitch?: number;
            rate?: number;
        };

        
        const requestBody: Record<string, unknown> = {
            text,
            voiceId,
        };
        if (style) requestBody['style'] = style;
        if (format) requestBody['format'] = format;
        if (pitch) requestBody['pitch'] = pitch;
        if (rate) requestBody['rate'] = rate;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${MURF_API_URL}/speech/generate`,
            headers: {
                'Content-Type': 'application/json',
                'api-key': auth,
            },
            body: requestBody,
        });

        return response.body;
    },
});