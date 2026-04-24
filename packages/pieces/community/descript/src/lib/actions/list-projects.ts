import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { descriptAuth } from '../../';
import { descriptCommon } from '../common';

type Project = {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
};

export const descriptListProjectsAction = createAction({
    auth: descriptAuth,
    name: 'list_projects',
    displayName: 'List Projects',
    description: 'Returns all projects in your Descript Drive, sorted by name.',
    props: {},
    async run(context) {
        const projects = await descriptCommon.fetchAllProjects(
            descriptCommon.getAuthToken(context.auth),
        );
        const projectsWithDates: Project[] = [];

        // Fetch extra fields by listing with full detail
        const response = await descriptCommon.descriptApiCall<{
            data: Project[];
            pagination: { next_cursor?: string };
        }>({
            apiKey: descriptCommon.getAuthToken(context.auth),
            method: HttpMethod.GET,
            path: '/projects',
            queryParams: { limit: '100', sort: 'name', direction: 'asc' },
        });

        projectsWithDates.push(...response.body.data);

        let cursor = response.body.pagination.next_cursor;
        while (cursor) {
            const next = await descriptCommon.descriptApiCall<{
                data: Project[];
                pagination: { next_cursor?: string };
            }>({
                apiKey: descriptCommon.getAuthToken(context.auth),
                method: HttpMethod.GET,
                path: '/projects',
                queryParams: { limit: '100', sort: 'name', direction: 'asc', cursor },
            });
            projectsWithDates.push(...next.body.data);
            cursor = next.body.pagination.next_cursor;
        }

        return projectsWithDates.map((p) => ({
            project_id: p.id,
            project_name: p.name,
            created_at: p.created_at,
            updated_at: p.updated_at,
        }));
    },
});
