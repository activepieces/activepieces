import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wrikeAuth } from '../common/auth';
import { wrikeCommon } from '../common/client';

export const findFolder = createAction({
    name: 'find_folder',
    displayName: 'Find Folder / Project',
    description: 'Retrieve folder / project metadata by ID or name',
    auth: wrikeAuth,
    props: {
        folderId: Property.ShortText({
            displayName: 'Folder ID',
            description: 'The ID of the folder/project to retrieve. If provided, other search criteria will be ignored.',
            required: false,
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: 'Search for folders/projects by title (partial match)',
            required: false,
        }),
        parentIds: Property.Array({
            displayName: 'Parent IDs',
            description: 'Search for folders/projects within specific parent folders',
            required: false,
            properties: {
                folderId: Property.ShortText({
                    displayName: 'Folder ID',
                    required: true,
                }),
            },
        }),
        project: Property.Checkbox({
            displayName: 'Is Project',
            description: 'Filter to only return projects (folders marked as projects)',
            required: false,
        }),
        pageSize: Property.Number({
            displayName: 'Page Size',
            description: 'Maximum number of folders/projects to return (max 1000)',
            required: false,
            defaultValue: 100,
        }),
        authors: Property.Array({
            displayName: 'Author IDs',
            description: 'Filter by authors (users who created the folders)',
            required: false,
            properties: {
                userId: Property.ShortText({
                    displayName: 'User ID',
                    required: true,
                }),
            },
        }),
        owners: Property.Array({
            displayName: 'Owner IDs',
            description: 'Filter by owners (users who own the projects)',
            required: false,
            properties: {
                userId: Property.ShortText({
                    displayName: 'User ID',
                    required: true,
                }),
            },
        }),
    },
    async run(context) {
        const props = context.propsValue as any;
        const { folderId, title, parentIds, project, pageSize, authors, owners } = props;

        if (folderId) {
            const response = await wrikeCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: `/folders/${folderId}`,
            });
            return response.body;
        }

        const queryParams: Record<string, string> = {};

        if (title) queryParams['title'] = title;
        if (parentIds && parentIds.length > 0) {
            queryParams['parentIds'] = parentIds.map((parent: any) => parent.folderId).join(',');
        }
        if (project !== undefined) queryParams['project'] = project.toString();
        if (pageSize) queryParams['pageSize'] = pageSize.toString();
        if (authors && authors.length > 0) {
            queryParams['authors'] = authors.map((author: any) => author.userId).join(',');
        }
        if (owners && owners.length > 0) {
            queryParams['owners'] = owners.map((owner: any) => owner.userId).join(',');
        }

        const response = await wrikeCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/folders',
            queryParams,
        });

        return response.body;
    },
});
