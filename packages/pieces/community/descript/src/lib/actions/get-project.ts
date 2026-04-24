import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { descriptAuth } from '../../';
import { descriptCommon } from '../common';

type Composition = {
    id: string;
    name: string;
    duration?: number;
    media_type?: string;
};

type MediaFile = {
    type: string;
    duration?: number;
};

type ProjectDetailResponse = {
    id: string;
    name: string;
    drive_id: string;
    created_at: string;
    updated_at: string;
    media_files: Record<string, MediaFile>;
    compositions: Composition[];
};

export const descriptGetProjectAction = createAction({
    auth: descriptAuth,
    name: 'get_project',
    displayName: 'Get Project',
    description:
        'Retrieves details for a Descript project including its compositions and media files.',
    props: {
        project_id: descriptCommon.projectIdProp,
    },
    async run(context) {
        const response = await descriptCommon.descriptApiCall<ProjectDetailResponse>({
            apiKey: descriptCommon.getAuthToken(context.auth),
            method: HttpMethod.GET,
            path: `/projects/${context.propsValue.project_id}`,
        });

        const project = response.body;

        return {
            project_id: project.id,
            project_name: project.name,
            drive_id: project.drive_id,
            created_at: project.created_at,
            updated_at: project.updated_at,
            composition_count: project.compositions.length,
            media_file_count: Object.keys(project.media_files).length,
            compositions: JSON.stringify(
                project.compositions.map((c) => ({
                    id: c.id,
                    name: c.name,
                    duration_seconds: c.duration ?? null,
                    media_type: c.media_type ?? null,
                })),
            ),
            media_files: JSON.stringify(
                Object.entries(project.media_files).map(([path, file]) => ({
                    path,
                    type: file.type,
                    duration_seconds: file.duration ?? null,
                })),
            ),
        };
    },
});
