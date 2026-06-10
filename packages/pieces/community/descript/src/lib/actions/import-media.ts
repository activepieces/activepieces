import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { descriptAuth } from '../auth';
import { descriptCommon } from '../common';

export const descriptImportMediaAction = createAction({
    auth: descriptAuth,
    name: 'import_media',
    displayName: 'Import Media',
    description:
        'Imports a media file from a URL into a new or existing Descript project and optionally creates a composition.',
    props: {
        mode: Property.StaticDropdown({
            displayName: 'Project',
            description: 'Create a new project or import into an existing one.',
            required: true,
            defaultValue: 'new',
            options: {
                options: [
                    { label: 'Create new project', value: 'new' },
                    { label: 'Import into existing project', value: 'existing' },
                ],
            },
        }),
        project_id: Property.Dropdown({
            auth: descriptAuth,
            displayName: 'Existing Project',
            description: 'Select the project to import media into.',
            refreshers: ['mode'],
            required: false,
            options: async ({ auth, mode }) => {
                if (mode !== 'existing') return { disabled: true, options: [], placeholder: 'Not needed for new projects' };
                if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
                try {
                    const projects = await descriptCommon.fetchAllProjects(
                        descriptCommon.getAuthToken(auth),
                    );
                    return {
                        disabled: false,
                        options: projects.map((p) => ({ label: p.name, value: p.id })),
                    };
                } catch {
                    return { disabled: true, options: [], placeholder: 'Failed to load projects. Check your connection.' };
                }
            },
        }),
        project_name: Property.ShortText({
            displayName: 'New Project Name',
            description: 'Name for the new project. Only used when creating a new project.',
            required: false,
        }),
        folder_name: Property.ShortText({
            displayName: 'Project Folder',
            description:
                'Folder path for the new project (e.g. "Clients/Acme"). Supports nested paths using "/". Missing folders are created automatically. Only applies when creating a new project.',
            required: false,
        }),
        team_access: Property.StaticDropdown({
            displayName: 'Team Access',
            description: 'Access level for Drive members on the new project. Only applies when creating a new project.',
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
        media_name: Property.ShortText({
            displayName: 'Media File Name',
            description:
                'Display name for the media file (e.g. "intro.mp4" or "Recordings/interview.mp4"). Use "/" to organize into sub-folders. Must not conflict with existing file names when importing into an existing project.',
            required: true,
        }),
        media_url: Property.ShortText({
            displayName: 'Media URL',
            description:
                'Public URL of the media file. Must be accessible by Descript servers and support HTTP Range requests. Sign URLs for 12–48 hours if they expire.',
            required: true,
        }),
        language: Property.ShortText({
            displayName: 'Transcription Language',
            description:
                'ISO 639-1 language code for transcription (e.g. "en", "es", "fr"). Leave blank to auto-detect from the audio.',
            required: false,
        }),
        composition_name: Property.ShortText({
            displayName: 'Composition Name',
            description:
                'Name for the composition (timeline) to create from the imported media. Leave blank to skip composition creation.',
            required: false,
        }),
        composition_width: Property.Number({
            displayName: 'Composition Width (px)',
            description: 'Width of the composition in pixels. Defaults to 1920. Only used when a Composition Name is provided.',
            required: false,
            defaultValue: 1920,
        }),
        composition_height: Property.Number({
            displayName: 'Composition Height (px)',
            description: 'Height of the composition in pixels. Defaults to 1080. Only used when a Composition Name is provided.',
            required: false,
            defaultValue: 1080,
        }),
        callback_url: Property.ShortText({
            displayName: 'Callback URL',
            description:
                'Optional webhook URL. When the import finishes or fails, Descript will POST the job status to this URL (same payload as Get Job Status).',
            required: false,
        }),
    },
    async run(context) {
        const {
            mode,
            project_id,
            project_name,
            folder_name,
            team_access,
            media_name,
            media_url,
            language,
            composition_name,
            composition_width,
            composition_height,
            callback_url,
        } = context.propsValue;

        const mediaItem: Record<string, string> = { url: media_url };
        if (language) mediaItem['language'] = language;

        const body: Record<string, unknown> = {
            add_media: { [media_name]: mediaItem },
        };

        if (mode === 'existing') {
            if (!project_id) throw new Error('Please select a project to import into.');
            body['project_id'] = project_id;
        } else {
            if (!project_name) throw new Error('Please enter a name for the new project.');
            body['project_name'] = project_name;
            if (folder_name) body['folder_name'] = folder_name;
            if (team_access) body['team_access'] = team_access;
        }

        if (composition_name) {
            body['add_compositions'] = [
                {
                    name: composition_name,
                    width: composition_width ?? 1920,
                    height: composition_height ?? 1080,
                    clips: [{ media: media_name }],
                },
            ];
        }

        if (callback_url) body['callback_url'] = callback_url;

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

        return response.body;
    },
});
