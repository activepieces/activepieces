import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wrikeAuth } from '../common/auth';
import { wrikeCommon } from '../common/client';

export const createProject = createAction({
    name: 'create_project',
    displayName: 'Create Project',
    description: 'Create a new project in Wrike',
    auth: wrikeAuth,
    props: {
        parentFolderId: Property.ShortText({
            displayName: 'Parent Folder ID',
            description: 'The ID of the parent folder where the project will be created. Leave empty to create at root level.',
            required: false,
        }),
        title: Property.ShortText({
            displayName: 'Project Title',
            description: 'The title of the project',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'The description of the project',
            required: false,
        }),
        ownerIds: Property.Array({
            displayName: 'Owner IDs',
            description: 'User IDs who will own the project',
            required: false,
            properties: {
                userId: Property.ShortText({
                    displayName: 'User ID',
                    required: true,
                }),
            },
        }),
        shareds: Property.Array({
            displayName: 'Shared Users',
            description: 'User IDs to share the project with',
            required: false,
            properties: {
                userId: Property.ShortText({
                    displayName: 'User ID',
                    required: true,
                }),
            },
        }),
        start_date: Property.DateTime({
            displayName: 'Start Date',
            description: 'Project start date',
            required: false,
        }),
        end_date: Property.DateTime({
            displayName: 'End Date',
            description: 'Project end date',
            required: false,
        }),
    },
    async run(context) {
        const props = context.propsValue as any;
        const { parentFolderId, title, description, ownerIds, shareds, start_date, end_date } = props;

        const projectData: Record<string, any> = {
            title,
            project: {},
        };

        if (ownerIds && ownerIds.length > 0) {
            projectData['project']['ownerIds'] = ownerIds.map((owner: any) => owner.userId);
        } else {
            projectData['project']['ownerIds'] = [context.auth.access_token.split('.')[0]];
        }

        if (description) projectData['description'] = description;

        if (shareds && shareds.length > 0) {
            projectData['shareds'] = shareds.map((shared: any) => shared.userId);
        }

        if (start_date || end_date) {
            projectData['project']['dates'] = {};
            if (start_date) projectData['project']['dates']['start'] = start_date.split('T')[0];
            if (end_date) projectData['project']['dates']['end'] = end_date.split('T')[0];
        }

        let resourceUri = '/folders';
        if (parentFolderId) {
            resourceUri = `/folders/${parentFolderId}/folders`;
        }

        const response = await wrikeCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri,
            body: projectData,
        });

        return response.body;
    },
});
