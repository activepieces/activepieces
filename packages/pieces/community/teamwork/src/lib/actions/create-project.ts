import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const createProject = createAction({
    name: 'create_project',
    displayName: 'Create Project',
    description: 'Create a new project in Teamwork',
    auth: teamworkAuth,
    props: {
        name: Property.ShortText({
            displayName: 'Project Name',
            description: 'Name of the project',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Project description',
            required: false,
        }),
        companyId: Property.ShortText({
            displayName: 'Company ID',
            description: 'ID of the company this project belongs to',
            required: false,
        }),
        startDate: Property.DateTime({
            displayName: 'Start Date',
            description: 'Project start date',
            required: false,
        }),
        endDate: Property.DateTime({
            displayName: 'End Date',
            description: 'Project end date',
            required: false,
        }),
        category: Property.ShortText({
            displayName: 'Category',
            description: 'Project category',
            required: false,
        }),
    },
    async run(context) {
        const { name, description, companyId, startDate, endDate, category } = context.propsValue;

        const projectData: any = {
            project: {
                name,
                description: description || '',
                'company-id': companyId || undefined,
                'start-date': startDate ? new Date(startDate).toISOString().split('T')[0] : undefined,
                'end-date': endDate ? new Date(endDate).toISOString().split('T')[0] : undefined,
                category: category || undefined,
            }
        };

        // Remove undefined values
        Object.keys(projectData.project).forEach(key => {
            if (projectData.project[key] === undefined) {
                delete projectData.project[key];
            }
        });

        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/projects.json',
            body: projectData,
        });

        return response;
    },
});
