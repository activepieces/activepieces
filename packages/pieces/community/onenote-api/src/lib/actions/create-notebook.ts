import { createAction, Property } from "@activepieces/pieces-framework";
import { onenoteApiAuth } from "../../index";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const createNotebook = createAction({
    name: 'create_notebook',
    displayName: 'Create Notebook',
    description: 'Creates a new OneNote notebook',
    auth: onenoteApiAuth,
    props: {
        display_name: Property.ShortText({
            displayName: 'Notebook Name',
            description: 'The name of the notebook (max 128 characters, cannot contain ?*/:<>|\'")',
            required: true,
            validation: (value: string) => {
                if (!value) {
                    return { valid: false, error: 'Notebook name is required' };
                }
                if (value.length > 128) {
                    return { valid: false, error: 'Notebook name cannot be longer than 128 characters' };
                }
                if (/[?*\/:<>|'""]/.test(value)) {
                    return { valid: false, error: 'Notebook name contains invalid characters' };
                }
                return { valid: true };
            }
        })
    },
    async run(context) {
        const { display_name } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://graph.microsoft.com/v1.0/me/onenote/notebooks`,
            headers: {
                'Authorization': `Bearer ${context.auth.access_token}`,
                'Content-Type': 'application/json'
            },
            body: {
                displayName: display_name
            }
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create notebook: ${JSON.stringify(response.body)}`);
        }

        return response.body;
    }
});