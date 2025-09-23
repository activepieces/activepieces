import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, HttpResponse } from '@activepieces/pieces-common';
import { cambaiAuth } from '../../index';
import { API_BASE_URL, listSourceLanguagesDropdown, listVoicesDropdown ,POLLING_INTERVAL_MS,MAX_POLLING_ATTEMPTS } from '../common';
import { listFoldersDropdown } from '../common';

export const createTextToSpeech = createAction({
    auth: cambaiAuth,
    name: 'create_text_to_speech',
    displayName: 'Create Text-to-Speech',
    description: 'Convert text into speech using a specified voice, language, gender, and age group.',
    props: {
        text: Property.LongText({
            displayName: 'Text',
            description: 'The text to be converted to speech.',
            required: true,
        }),
        language: listSourceLanguagesDropdown,
        voice_id: listVoicesDropdown,
        gender: Property.StaticDropdown({
            displayName: 'Gender',
            description: 'The gender of the speaker.',
            required: false,
            options: {
                options: [
                    { label: 'Male', value: 1 },
                    { label: 'Female', value: 2 },
                    { label: 'Neutral', value: 0 },
                    { label: 'Unspecified', value: 9 },
                ],
            }
        }),
        age: Property.Number({
            displayName: 'Age',
            description: 'The age of the speaker to be generated.',
            required: false,
        }),
        project_name: Property.ShortText({
            displayName: 'Project Name',
            description: 'A memorable name for your project to help organize tasks in your Camb.ai workspace.',
            required: false,
        }),
        project_description: Property.LongText({
            displayName: 'Project Description',
            description: 'Provide details about your project\'s goals and specifications for documentation purposes.',
            required: false,
        }),
        folder_id: listFoldersDropdown,
    },
    async run(context) {
        const { auth } = context;
        const { text, language, voice_id, gender, age, project_name, project_description, folder_id } = context.propsValue;

        const payload: Record<string, unknown> = { text, language: Number(language), voice_id: Number(voice_id) };
        if (gender !== undefined) payload['gender'] = gender;
        if (age) payload['age'] = age;
        if (project_name) payload['project_name'] = project_name;
        if (project_description) payload['project_description'] = project_description;
        if (folder_id) payload['folder_id'] = folder_id;


        const initialResponse = await httpClient.sendRequest<{ task_id: string }>({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/tts`,
            headers: { 'x-api-key': auth, 'Content-Type': 'application/json' },
            body: payload,
        });
        const taskId = initialResponse.body.task_id;

        let attempts = 0;
        let run_id: string | null = null;
        while (attempts < MAX_POLLING_ATTEMPTS) {
            const statusResponse = await httpClient.sendRequest<{ status: string; run_id?: string }>({
                method: HttpMethod.GET,
                url: `${API_BASE_URL}/tts/${taskId}`,
                headers: { 'x-api-key': auth },
            });

            if (statusResponse.body.status === 'SUCCESS') {

                run_id = statusResponse.body.run_id ?? null;
                break;
            }
            if (statusResponse.body.status === 'FAILED') {

                throw new Error(`Text-to-Speech task failed: ${JSON.stringify(statusResponse.body)}`);
            }

            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
            attempts++;
        }


        if (!run_id) {
            throw new Error("Text-to-Speech task timed out or failed to return a run_id.");
        }


        const audioResponse: HttpResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/tts-result/${run_id}`,
            headers: { 'x-api-key': auth },
            responseType: 'arraybuffer',
        });
        
        const fileName = `speech_${run_id}.wav`;
        const fileData = Buffer.from(audioResponse.body as ArrayBuffer);
        const fileUrl = await context.files.write({
            fileName,
            data: fileData,
        });

        return {
            message: "Speech generated successfully.",
            audio_url: fileUrl,
            run_id: run_id,
        };
    },
});