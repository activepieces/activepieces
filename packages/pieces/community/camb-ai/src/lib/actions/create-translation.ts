import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { cambaiAuth } from '../auth';
import { API_BASE_URL, listSourceLanguagesDropdown, listTargetLanguagesDropdown, POLLING_INTERVAL_MS, MAX_POLLING_ATTEMPTS, pollTaskUntilComplete } from '../common';

export const createTranslation = createAction({
    auth: cambaiAuth,
    name: 'create_translation',
    displayName: 'Create Translation',
    description: 'Translate text from a source language to a target language.',
    props: {
        texts: Property.LongText({
            displayName: 'Text to Translate',
            description: 'The text to be translated. You can enter multiple lines; each line will be treated as a separate text segment.',
            required: true,
        }),
        source_language: listSourceLanguagesDropdown,
        target_language: listTargetLanguagesDropdown,
        formality: Property.StaticDropdown({
            displayName: 'Formality',
            description: 'Adjust the formality level to match your context.',
            required: false,
            options: {
                options: [
                    { label: 'Formal', value: 1 },
                    { label: 'Informal', value: 2 },
                ]
            }
        }),
        gender: Property.StaticDropdown({
            displayName: 'Gender',
            description: 'Specify grammatical gender preferences when relevant in the target language.',
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
            displayName: 'Audience Age',
            description: 'Helps adjust vocabulary and expressions to be age-appropriate.',
            required: false,
        }),
        project_name: Property.ShortText({
            displayName: 'Project Name',
            description: 'A memorable name for your project to help organize tasks in your Camb.ai workspace.',
            required: false,
        }),
    },
    async run(context) {
        const { auth } = context;
        const { texts, source_language, target_language, formality, gender, age, project_name } = context.propsValue;

        const payload: Record<string, unknown> = {
            texts: texts.split('\n').filter(line => line.trim().length > 0),
            source_language: Number(source_language),
            target_language: Number(target_language),
        };
        if (formality !== undefined) payload['formality'] = formality;
        if (gender !== undefined) payload['gender'] = gender;
        if (age) payload['age'] = age;
        if (project_name) payload['project_name'] = project_name;

        const initialResponse = await httpClient.sendRequest<{ task_id: string }>({
            method: HttpMethod.POST,
            url: `${API_BASE_URL}/translate`,
            headers: { 'x-api-key': auth.secret_text, 'Content-Type': 'application/json' },
            body: payload,
        });
        const taskId = initialResponse.body.task_id;

        const runId = await pollTaskUntilComplete(
            auth.secret_text,
            `${API_BASE_URL}/translate/${taskId}`,
            MAX_POLLING_ATTEMPTS,
            POLLING_INTERVAL_MS,
        );

        const resultResponse = await httpClient.sendRequest<{ translations: string[] }>({
            method: HttpMethod.GET,
            url: `${API_BASE_URL}/translation-result/${runId}`,
            headers: { 'x-api-key': auth.secret_text },
        });

        return resultResponse.body;
    },
});