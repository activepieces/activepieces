import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const updateProject = createAction({
    name: 'update_project',
    auth: copperAuth,
    displayName: 'Update Project',
    description: 'Updates a project record.',
    props: {
        project_id: copperProps.projectId,
        name: Property.ShortText({
            displayName: 'Project Name',
            required: false,
        }),
        company_id: copperProps.optionalCompanyId,
        assignee_id: copperProps.assigneeId,
        details: Property.LongText({
            displayName: 'Details',
            description: 'A description of the project.',
            required: false,
        }),
    },
    async run(context) {
        const { project_id, ...updatedFields } = context.propsValue;

        const body: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(updatedFields)) {
            if (value !== undefined && value !== null && value !== '') {
                body[key] = value;
            }
        }
        
        if (Object.keys(body).length === 0) {
            return { success: true, message: "No fields were provided to update." };
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: `https://api.copper.com/developer_api/v1/projects/${project_id}`,
            headers: {
                'X-PW-AccessToken': context.auth.token,
                'X-PW-UserEmail': context.auth.email,
                'X-PW-Application': 'developer_api',
                'Content-Type': 'application/json',
            },
            body: body
        });

        return response.body;
    }
});