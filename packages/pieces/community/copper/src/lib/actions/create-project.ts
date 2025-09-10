import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { copperAuth } from "../common/auth";
import { copperProps } from "../common/props";

export const createProject = createAction({
    name: 'create_project',
    auth: copperAuth,
    displayName: 'Create Project',
    description: 'Adds a new project.',
    props: {
        name: Property.ShortText({
            displayName: 'Project Name',
            required: true,
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
        const body = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.copper.com/developer_api/v1/projects`,
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