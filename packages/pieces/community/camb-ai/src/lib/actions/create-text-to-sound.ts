import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../auth';
import { cambCommon, cambOutputSchemas, listFoldersDropdown } from '../common';

export const createTextToSound = createAction({
    auth: cambaiAuth,
    name: 'create_text_to_sound',
    classification: 'WRITE',
    displayName: 'Create Text-to-Sound',
    description: 'Convert input text into “sound effects” using an AI model.',
    audience: 'human',
    outputSchema: cambOutputSchemas['textToSound'],
    props: {
        prompt: Property.LongText({
            displayName: 'Prompt',
            description: 'A clear, descriptive explanation of the desired audio effect. Concise prompts yield more accurate results.',
            required: true,
        }),
        duration: Property.Number({
            displayName: 'Duration (seconds)',
            description: 'The desired length of the audio in seconds (max 10). Defaults to 8 if not set.',
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
        const { prompt, duration, project_name, project_description, folder_id } = context.propsValue;
        return cambCommon.runTextToSound({
            apiKey: context.auth.secret_text,
            files: context.files,
            prompt,
            duration: duration ?? undefined,
            projectName: project_name,
            projectDescription: project_description,
            folderId: folder_id ?? undefined,
        });
    },
});
