import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../auth';
import { cambCommon, cambOutputSchemas, listFoldersDropdown, listSourceLanguagesDropdown, listTargetLanguagesDropdown } from '../common';

export const createTranslation = createAction({
    auth: cambaiAuth,
    name: 'create_translation',
    classification: 'WRITE',
    displayName: 'Create Translation',
    description: 'Translate text from a source language to a target language.',
    audience: 'human',
    outputSchema: cambOutputSchemas['translation'],
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
        project_description: Property.LongText({
            displayName: 'Project Description',
            description: 'Provide details about your project\'s goals and specifications for documentation purposes.',
            required: false,
        }),
        folder_id: listFoldersDropdown,
    },
    async run(context) {
        const { texts, source_language, target_language, formality, gender, age, project_name, project_description, folder_id } = context.propsValue;
        return cambCommon.runTranslation({
            apiKey: context.auth.secret_text,
            texts,
            sourceLanguage: Number(source_language),
            targetLanguage: Number(target_language),
            formality: formality ?? undefined,
            gender: gender ?? undefined,
            age: age ?? undefined,
            projectName: project_name,
            projectDescription: project_description,
            folderId: folder_id ?? undefined,
        });
    },
});
