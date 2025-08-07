import { createAction, Property } from "@activepieces/pieces-framework";
import { onenoteApiAuth } from "../../index";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const createImageNote = createAction({
    name: 'create_image_note',
    displayName: 'Create Image Note',
    description: 'Creates a new note (page) in a section with an embedded image from a public URL.',
    auth: onenoteApiAuth,
    props: {
        section_id: Property.Dropdown({
            displayName: 'Section',
            description: 'Select the section to create the image note in',
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
                return (response.body.value ?? []).map((section: { id: string; displayName: string }) => ({
                    label: section.displayName,
                    value: section.id
                }));
            }
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: 'The title of the note',
            required: true
        }),
        image_url: Property.ShortText({
            displayName: 'Image URL',
            description: 'Publicly accessible image URL (must start with http or https)',
            required: true,
            validation: (value: string) => {
                if (!/^https?:\/\/.+/i.test(value)) {
                    return { valid: false, error: 'Please enter a valid public image URL (http or https).' };
                }
                return { valid: true };
            }
        }),
        image_width: Property.Number({
            displayName: 'Image Width (px)',
            description: 'Width of the image in pixels (optional)',
            required: false
        })
    },
    async run(context) {
        const { section_id, title, image_url, image_width } = context.propsValue;

        // Build HTML content for the note
        const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta name="created" content="${new Date().toISOString()}"/>
  </head>
  <body>
    <p>This page displays an image from the web.</p>
    <img src="${image_url}"${image_width ? ` width="${image_width}"` : ''} />
  </body>
</html>
        `.trim();

        // Prepare multipart form data
        const boundary = "MyAppPartBoundary" + Date.now();
        const body =
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="Presentation"\r\n` +
            `Content-Type: text/html\r\n\r\n` +
            html + `\r\n` +
            `--${boundary}--`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://graph.microsoft.com/v1.0/me/onenote/sections/${section_id}/pages`,
            headers: {
                'Authorization': `Bearer ${context.auth.access_token}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create image note: ${JSON.stringify(response.body)}`);
        }

        return response.body;
    }
});