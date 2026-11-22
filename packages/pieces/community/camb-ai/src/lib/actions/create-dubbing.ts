import { createAction, Property } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../auth';
import { cambCommon, cambOutputSchemas, dubSourceLocaleDropdown, dubTargetLocalesDropdown } from '../common';

export const createDubbing = createAction({
    auth: cambaiAuth,
    name: 'create_dubbing',
    classification: 'WRITE',
    displayName: 'Create Dubbing',
    description: 'Dub a video into one or more languages.',
    audience: 'human',
    outputSchema: cambOutputSchemas['dubbing'],
    props: {
        video_url: Property.ShortText({
            displayName: 'Video URL',
            description: 'A YouTube, Google Drive or direct link to the video.',
            required: true,
        }),
        source_language: dubSourceLocaleDropdown,
        target_languages: dubTargetLocalesDropdown,
        project_name: Property.ShortText({
            displayName: 'Project Name',
            description: 'A name for the project in your Camb.ai workspace (3-255 characters).',
            required: false,
        }),
        project_description: Property.LongText({
            displayName: 'Project Description',
            required: false,
        }),
        transcription_mode: Property.StaticDropdown({
            displayName: 'Transcription Mode',
            description: 'Fast is quicker; slow is more accurate.',
            required: false,
            options: {
                options: [
                    { label: 'Fast', value: 'fast' },
                    { label: 'Slow', value: 'slow' },
                ],
            },
        }),
        include_music_in_fg: Property.Checkbox({
            displayName: 'Keep Background Music in Foreground',
            required: false,
        }),
        wait_for_completion: Property.Checkbox({
            displayName: 'Wait for Completion',
            description: 'Wait up to 9 minutes for the dub to finish. Turn off to return the task ID right away and check it later with Get Task Status.',
            required: false,
            defaultValue: true,
        }),
    },
    async run(context) {
        const p = context.propsValue;
        return cambCommon.runDubbing({
            apiKey: context.auth.secret_text,
            videoUrl: p.video_url.trim(),
            sourceLanguage: p.source_language,
            targetLanguages: p.target_languages,
            projectName: p.project_name,
            projectDescription: p.project_description,
            transcriptionMode: p.transcription_mode,
            includeMusicInForeground: p.include_music_in_fg ?? undefined,
            waitForCompletion: p.wait_for_completion !== false,
        });
    },
});
