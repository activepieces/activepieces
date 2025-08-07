import { createAction, Property } from "@activepieces/pieces-framework";
import { onenoteApiAuth } from "../../index";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const appendNote = createAction({
    name: 'append_note',
    displayName: 'Append Note',
    description: 'Appends content to the end of an existing OneNote page (note).',
    auth: onenoteApiAuth,
    props: {
        page_id: Property.Dropdown({
            displayName: 'Page',
            description: 'Select the page (note) to append content to',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                const response = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: 'https://graph.microsoft.com/v1.0/me/onenote/pages',
                    headers: {
                        'Authorization': `Bearer ${(auth as { access_token: string }).access_token}`
                    }
                });
                return (response.body.value ?? []).map((page: { id: string; title: string }) => ({
                    label: page.title,
                    value: page.id
                }));
            }
        }),
        target: Property.StaticDropdown({
            displayName: 'Append To',
            description: 'Where to append the content',
            required: true,
            options: {
                options: [
                    { label: 'Page Body (end of first div)', value: 'body' },
                    { label: 'Specific Element by data-id', value: 'data-id' }
                ]
            }
        }),
        data_id: Property.ShortText({
            displayName: 'Element data-id (if applicable)',
            description: 'The data-id of the element to append to (required if "Specific Element by data-id" is selected)',
            required: false,
            visible: (props) => props.target === 'data-id'
        }),
        html_content: Property.LongText({
            displayName: 'HTML Content',
            description: 'The HTML content to append (e.g., <p>New content</p>)',
            required: true
        })
    },
    async run(context) {
        const { page_id, target, data_id, html_content } = context.propsValue;

        // Determine the target for the patch command
        let patchTarget = 'body';
        if (target === 'data-id') {
            if (!data_id) {
                throw new Error('Element data-id is required when appending to a specific element.');
            }
            patchTarget = `#${data_id}`;
        }

        // Build the patch command (always appends as last child)
        const patchCommand = {
            target: patchTarget,
            action: 'append',
            content: html_content
        };

        // Send PATCH request to append content
        const response = await httpClient.sendRequest({
            method: HttpMethod.PATCH,
            url: `https://graph.microsoft.com/v1.0/me/onenote/pages/${page_id}/content`,
            headers: {
                'Authorization': `Bearer ${context.auth.access_token}`,
                'Content-Type': 'application/json'
            },
            body: [patchCommand]
        });

        if (response.status !== 204) {
            throw new Error(`Failed to append content: ${JSON.stringify(response.body)}`);
        }

        return {
            success: true,
            message: 'Content appended successfully.'
        };
    }
});