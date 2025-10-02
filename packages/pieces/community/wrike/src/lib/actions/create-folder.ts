/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/dot-notation */
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wrikeAuth } from '../common/auth';
import { wrikeCommon } from '../common/client';

export const createFolder = createAction({
    name: 'create_folder',
    displayName: 'Create Folder',
    description: 'Create a new folder in Wrike',
    auth: wrikeAuth,
    props: {
        parentFolderId: Property.ShortText({
            displayName: 'Parent Folder ID',
            description: 'The ID of the parent folder where the new folder will be created. Leave empty to create at root level.',
            required: false,
        }),
        title: Property.ShortText({
            displayName: 'Folder Title',
            description: 'The title of the folder',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'The description of the folder',
            required: false,
        }),
        shareds: Property.Array({
            displayName: 'Shared Users',
            description: 'User IDs to share the folder with',
            required: false,
            properties: {
                userId: Property.ShortText({
                    displayName: 'User ID',
                    required: true,
                }),
            },
        }),
        project: Property.Checkbox({
            displayName: 'Create as Project',
            description: 'Whether this folder should be created as a project with additional project settings',
            required: false,
            defaultValue: false,
        }),
        projectOwnerId: Property.ShortText({
            displayName: 'Project Owner ID',
            description: 'The ID of the user who will own the project (required when creating as project)',
            required: false,
        }),
        projectStartDate: Property.DateTime({
            displayName: 'Project Start Date',
            description: 'The start date of the project',
            required: false,
        }),
        projectEndDate: Property.DateTime({
            displayName: 'Project End Date',
            description: 'The end date of the project',
            required: false,
        }),
    },
    async run(context) {
        const props = context.propsValue as any;
        const { parentFolderId, title, description, shareds, project, projectOwnerId, projectStartDate, projectEndDate } = props;

        const folderData: Record<string, any> = {
            title,
        };

        if (description) folderData['description'] = description;

        if (shareds && shareds.length > 0) {
            folderData['shareds'] = shareds.map((shared: any) => shared.userId);
        }

        if (project) {
            const projectData: Record<string, any> = {};

            if (projectOwnerId) {
                projectData['ownerIds'] = [projectOwnerId];
            } else {
                projectData['ownerIds'] = [context.auth.access_token.split('.')[0]];
            }

            if (projectStartDate) {
                projectData['startDate'] = projectStartDate.split('T')[0]; // Format as YYYY-MM-DD
            }

            if (projectEndDate) {
                projectData['endDate'] = projectEndDate.split('T')[0]; // Format as YYYY-MM-DD
            }

            folderData['project'] = projectData;
        }

        let resourceUri = '/folders';
        if (parentFolderId) {
            resourceUri = `/folders/${parentFolderId}/folders`;
        }

        const response = await wrikeCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri,
            body: folderData,
        });

        return response.body;
    },
});
