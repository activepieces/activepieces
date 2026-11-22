import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { cambaiAuth } from '../auth';
import { cambCommon, cambOutputSchemas, listFoldersDropdown, listSourceLanguagesDropdown } from '../common';

export const createTranscription = createAction({
    auth: cambaiAuth,
    name: 'create_transcription',
    classification: 'WRITE',
    displayName: 'Create Transcription',
    description: 'Creates a task to process speech into readable text.',
    audience: 'human',
    outputSchema: cambOutputSchemas['transcription'],
    props: {
        language: listSourceLanguagesDropdown,
        source_type: Property.StaticDropdown({
            displayName: 'Media Source',
            description: 'Choose whether to upload a file or provide a URL.',
            required: true,
            defaultValue: 'file',
            options: {
                options: [
                    { label: 'Upload File', value: 'file' },
                    { label: 'File URL', value: 'url' },
                ]
            },
        }),
        media: Property.DynamicProperties({
            auth: cambaiAuth,
            displayName: 'Media',
            required: true,
            refreshers: ['source_type'],
            props: async (context) => {
                const sourceType = context['source_type'];
                const fields: DynamicPropsValue = {};
                if (sourceType === 'file') {
                    fields['media_file'] = Property.File({
                        displayName: 'Media File',
                        description: 'The media file (e.g., MP3, WAV, MP4) to transcribe. Max size: 20MB.',
                        required: true,
                    });
                } else if (sourceType === 'url') {
                    fields['media_url'] = Property.ShortText({
                        displayName: 'Media URL',
                        description: 'A public URL to the media file to transcribe.',
                        required: true,
                    });
                }
                return fields;
            }
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
        const { language, source_type, media, project_name, project_description, folder_id } = context.propsValue;
        const mediaFile = toFile(media['media_file']);
        const mediaUrl = media['media_url'];
        if (source_type === 'url') {
            if (typeof mediaUrl !== 'string' || mediaUrl.trim() === '') {
                throw new Error("Media URL is required when source is 'File URL'.");
            }
        } else if (!mediaFile) {
            throw new Error("Media File is required when source is 'Upload File'.");
        }
        return cambCommon.runTranscription({
            apiKey: context.auth.secret_text,
            language: Number(language),
            mediaUrl: source_type === 'url' && typeof mediaUrl === 'string' ? mediaUrl.trim() : undefined,
            mediaFile: source_type === 'url' ? undefined : mediaFile,
            projectName: project_name,
            projectDescription: project_description,
            folderId: folder_id ?? undefined,
        });
    },
});

function toFile(value: unknown): { data: Buffer; filename: string } | undefined {
    if (typeof value !== 'object' || value === null || !('data' in value) || !('filename' in value)) {
        return undefined;
    }
    const { data, filename } = value;
    if (!Buffer.isBuffer(data) || typeof filename !== 'string') {
        return undefined;
    }
    return { data, filename };
}
