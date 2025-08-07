import { createAction, Property } from "@activepieces/pieces-framework";
import { onenoteApiAuth } from "../../index";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const createPage = createAction({
    name: 'create_page',
    displayName: 'Create Page',
    description: 'Creates a new page in a section',
    auth: onenoteApiAuth,
    props: {
        section_id: Property.Dropdown({
            displayName: 'Section',
            description: 'The section to create the page in',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                const response = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: 'https://graph.microsoft.com/v1.0/me/onenote/sections',
                    headers: {
                        'Authorization': `Bearer ${(auth as { access_token: string }).access_token}`
                    }
                });
                return response.body.value.map((section: { id: string; displayName: string }) => ({
                    label: section.displayName,
                    value: section.id
                }));
            }
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: 'The title of the page',
            required: true,
        }),
        content: Property.LongText({
            displayName: 'Content',
            description: 'The HTML content of the page',
            required: true,
        }),
        image_url: Property.ShortText({
            displayName: 'Image URL',
            description: 'Optional URL of an image to include in the page',
            required: false,
        })
    },
    async run(context) {
        const { section_id, title, content, image_url } = context.propsValue;

        // Create basic HTML structure
        const htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${title}</title>
                    <meta name="created" content="${new Date().toISOString()}" />
                </head>
                <body>
                    ${content}
                    ${image_url ? `<img src="${image_url}" alt="Included image" />` : ''}
                </body>
            </html>
        `;

        // Make the API request to create page
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://graph.microsoft.com/v1.0/me/onenote/sections/${section_id}/pages`,
            headers: {
                'Authorization': `Bearer ${context.auth.access_token}`,
                'Content-Type': 'text/html'
            },
            body: htmlContent
        });

        // Return the created page
        return response.body;
    }
});