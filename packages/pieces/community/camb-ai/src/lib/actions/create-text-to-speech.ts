import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../auth';
import { cambCommon, cambOutputSchemas, listFoldersDropdown, listSourceLanguagesDropdown, listVoicesDropdown } from '../common';

export const createTextToSpeech = createAction({
    auth: cambaiAuth,
    name: 'create_text_to_speech',
    classification: 'WRITE',
    displayName: 'Create Text-to-Speech',
    description: 'Convert text into speech using a specified voice, language, gender, and age group.',
    audience: 'human',
    outputSchema: cambOutputSchemas['textToSpeech'],
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
        const { text, language, voice_id, gender, age, project_name, project_description, folder_id } = context.propsValue;
        return cambCommon.runTts({
            apiKey: context.auth.secret_text,
            files: context.files,
            text,
            language: Number(language),
            voiceId: Number(voice_id),
            gender: gender ?? undefined,
            age: age ?? undefined,
            projectName: project_name,
            projectDescription: project_description,
            folderId: folder_id ?? undefined,
        });
    },
});
