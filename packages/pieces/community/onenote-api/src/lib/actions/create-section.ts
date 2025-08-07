import { createAction, Property } from "@activepieces/pieces-framework";
import { onenoteApiAuth } from "../../index";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const createSection = createAction({
    name: 'create_section',
    displayName: 'Create Section',
    description: 'Creates a new section in a notebook',
    auth: onenoteApiAuth,
    props: {
        notebook_id: Property.Dropdown({
            displayName: 'Notebook',
            description: 'Select the notebook to create the section in',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                const response = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: `https://graph.microsoft.com/v1.0/me/onenote/notebooks`,
                    headers: {
                        'Authorization': `Bearer ${(auth as { access_token: string }).access_token}`
                    }
                });
                return (response.body.value ?? []).map((notebook: { id: string; displayName: string }) => ({
                    label: notebook.displayName,
                    value: notebook.id
                }));
            }
        }),
        display_name: Property.ShortText({
            displayName: 'Section Name',
            description: 'The name of the section (max 50 characters, cannot contain ?*/:<>|&#\'\'%~)',
            required: true,
            validation: (value: string) => {
                if (!value) {
                    return { valid: false, error: 'Section name is required' };
                }
                if (value.length > 50) {
                    return { valid: false, error: 'Section name cannot be longer than 50 characters' };
                }
                if (/[?*\/:<>|&#'%~]/.test(value)) {
                    return { valid: false, error: 'Section name contains invalid characters' };
                }
                return { valid: true };
            }
        })
    },
    async run(context) {
        const { notebook_id, display_name } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://graph.microsoft.com/v1.0/me/onenote/notebooks/${notebook_id}/sections`,
            headers: {
                'Authorization': `Bearer ${context.auth.access_token}`,
                'Content-Type': 'application/json'
            },
            body: {
                displayName: display_name
            }
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create section: ${JSON.stringify(response.body)}`);
        }

        return response.body;
    }
});