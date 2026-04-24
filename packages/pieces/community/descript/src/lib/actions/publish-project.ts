import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { descriptAuth } from '../../';
import { descriptCommon } from '../common';

export const descriptPublishProjectAction = createAction({
    auth: descriptAuth,
    name: 'publish_project',
    displayName: 'Publish Project',
    description:
        'Publishes a composition from a project to create a shareable link and a downloadable export file.',
    props: {
        project_id: descriptCommon.projectIdProp,
        composition_id: descriptCommon.compositionIdProp(false),
        media_type: Property.StaticDropdown({
            displayName: 'Output Type',
            description: 'Choose whether to export the project as a video or audio file.',
            required: false,
            defaultValue: 'Video',
            options: {
                options: [
                    { label: 'Video', value: 'Video' },
                    { label: 'Audio only', value: 'Audio' },
                ],
            },
        }),
        resolution: Property.StaticDropdown({
            displayName: 'Video Resolution',
            description: 'Resolution for the exported video. Only applies when Output Type is Video.',
            required: false,
            defaultValue: '1080p',
            options: {
                options: [
                    { label: '480p', value: '480p' },
                    { label: '720p', value: '720p' },
                    { label: '1080p (Full HD)', value: '1080p' },
                    { label: '1440p (2K)', value: '1440p' },
                    { label: '4K', value: '4K' },
                ],
            },
        }),
        access_level: Property.StaticDropdown({
            displayName: 'Share Access Level',
            description:
                'Who can view the published share page. Leave blank to use your Drive\'s default setting.',
            required: false,
            options: {
                options: [
                    { label: 'Public (anyone)', value: 'public' },
                    { label: 'Unlisted (link only)', value: 'unlisted' },
                    { label: 'Drive members only', value: 'drive' },
                    { label: 'Private (owner only)', value: 'private' },
                ],
            },
        }),
    },
    async run(context) {
        const { project_id, composition_id, media_type, resolution, access_level } = context.propsValue;

        const body: Record<string, unknown> = { project_id };
        if (composition_id) body['composition_id'] = composition_id;
        if (media_type) body['media_type'] = media_type;
        if (media_type === 'Video' && resolution) body['resolution'] = resolution;
        if (access_level) body['access_level'] = access_level;

        const response = await descriptCommon.descriptApiCall<{
            job_id: string;
            drive_id: string;
            project_id: string;
            project_url: string;
        }>({
            apiKey: descriptCommon.getAuthToken(context.auth),
            method: HttpMethod.POST,
            path: '/jobs/publish',
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
