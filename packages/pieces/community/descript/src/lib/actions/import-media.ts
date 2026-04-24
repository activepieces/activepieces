import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { descriptAuth } from '../../';
import { descriptCommon } from '../common';

export const descriptImportMediaAction = createAction({
    auth: descriptAuth,
    name: 'import_media',
    displayName: 'Import Media',
    description:
        'Creates a new Descript project, imports a media file from a URL, and optionally creates a composition (timeline) from it.',
    props: {
        project_name: Property.ShortText({
            displayName: 'Project Name',
            description: 'Name for the new project that will be created in Descript.',
            required: true,
        }),
        media_name: Property.ShortText({
            displayName: 'Media File Name',
            description:
                'Display name for the media file in the project (e.g. "intro.mp4" or "Recordings/interview.mp4"). You can use a folder path with "/" to organize files.',
            required: true,
            defaultValue: 'media.mp4',
        }),
        media_url: Property.ShortText({
            displayName: 'Media URL',
            description:
                'Public URL of the media file to import. The URL must be accessible by Descript servers and support HTTP Range requests. Sign URLs for 12–48 hours if they expire.',
            required: true,
        }),
        language: Property.ShortText({
            displayName: 'Transcription Language',
            description:
                'ISO 639-1 language code for transcription (e.g. "en" for English, "es" for Spanish, "fr" for French). Leave blank to auto-detect from the audio.',
            required: false,
        }),
        composition_name: Property.ShortText({
            displayName: 'Composition Name',
            description:
                'Optional name for the composition (timeline) to create from the imported media. If left blank, no composition is created.',
            required: false,
        }),
        folder_name: Property.ShortText({
            displayName: 'Project Folder',
            description:
                'Optional folder path to place the new project in (e.g. "Clients/Acme"). Supports nested paths using "/" as separator. Missing folders are created automatically.',
            required: false,
        }),
        team_access: Property.StaticDropdown({
            displayName: 'Team Access',
            description: 'Access level for other members of your Drive.',
            required: false,
            defaultValue: 'none',
            options: {
                options: [
                    { label: 'None (private to owner)', value: 'none' },
                    { label: 'View', value: 'view' },
                    { label: 'Comment', value: 'comment' },
                    { label: 'Edit', value: 'edit' },
                ],
            },
        }),
    },
    async run(context) {
        const { project_name, media_name, media_url, language, composition_name, folder_name, team_access } =
            context.propsValue;

        const mediaItem: Record<string, string> = { url: media_url };
        if (language) mediaItem['language'] = language;

        const body: Record<string, unknown> = {
            project_name,
            add_media: { [media_name]: mediaItem },
        };

        if (composition_name) {
            body['add_compositions'] = [
                { name: composition_name, clips: [{ media: media_name }] },
            ];
        }
        if (folder_name) body['folder_name'] = folder_name;
        if (team_access) body['team_access'] = team_access;

        const response = await descriptCommon.descriptApiCall<{
            job_id: string;
            drive_id: string;
            project_id: string;
            project_url: string;
        }>({
            apiKey: descriptCommon.getAuthToken(context.auth),
            method: HttpMethod.POST,
            path: '/jobs/import/project_media',
            body,
        });

        return {
            job_id: response.body.job_id,
            drive_id: response.body.drive_id,
            project_id: response.body.project_id,
            project_url: response.body.project_url,
        };
    },
});
