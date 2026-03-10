import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, HttpHeaders } from '@activepieces/pieces-common';
import { cambaiAuth } from '../auth';
import { API_BASE_URL } from '../common';
import FormData from 'form-data';

export const cloneVoice = createAction({
    auth: cambaiAuth,
    name: 'clone_voice',
    displayName: 'Clone Voice',
    description: 'Create a custom voice clone from an audio sample.',
    props: {
        audio_file: Property.File({
            displayName: 'Audio File',
            description: 'An audio file containing a voice sample to clone (e.g., WAV, MP3).',
            required: true,
        }),
        voice_name: Property.ShortText({
            displayName: 'Voice Name',
            description: 'A name for the cloned voice.',
            required: true,
        }),
        gender: Property.StaticDropdown({
            displayName: 'Gender',
            description: 'The gender of the voice.',
            required: true,
            options: {
                options: [
                    { label: 'Male', value: 1 },
                    { label: 'Female', value: 2 },
                    { label: 'Neutral', value: 0 },
                    { label: 'Unspecified', value: 9 },
                ],
            },
        }),
        age: Property.Number({
            displayName: 'Age',
            description: 'The approximate age of the voice.',
            required: false,
        }),
        language: Property.Dropdown({
            auth: cambaiAuth,
            displayName: 'Language',
            description: 'The language spoken in the audio sample (optional).',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate first',
                    };
                }
                const response = await httpClient.sendRequest<{ id: number; language: string; short_name: string }[]>({
                    method: HttpMethod.GET,
                    url: `${API_BASE_URL}/source-languages`,
                    headers: { 'x-api-key': auth.secret_text },
                });
                const languages = response.body ?? [];
                return {
                    disabled: false,
                    options: languages.map((lang) => ({
                        label: `${lang.language} (${lang.short_name})`,
                        value: lang.id,
                    })),
                };
            },
        }),
    },
    async run(context) {
        const { auth } = context;
        const { audio_file, voice_name, gender, age, language } = context.propsValue;

        const formData = new FormData();
        const fileData = audio_file as ApFile;
        formData.append('audio_file', fileData.data, fileData.filename);
        formData.append('voice_name', voice_name);
        formData.append('gender', String(gender));
        if (age) formData.append('age', String(age));
        if (language !== undefined && language !== null) formData.append('language', String(language));

        const requestBody = formData.getBuffer();
        const headers: HttpHeaders = {
            'x-api-key': auth.secret_text,
            ...formData.getHeaders(),
        };

        const response = await httpClient.sendRequest<{ voice_id: number; voice_name: string }>({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/create-custom-voice`,
            headers,
            body: requestBody,
        });

        return response.body;
    },
});
