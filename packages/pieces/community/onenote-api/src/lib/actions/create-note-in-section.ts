import { createAction, Property } from "@activepieces/pieces-framework";
import { onenoteApiAuth } from "../../index";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const createNoteInSection = createAction({
    name: 'create_note_in_section',
    displayName: 'Create Note in Section',
    description: 'Creates a new note (page) in a specific notebook section with title and content.',
    auth: onenoteApiAuth,
    props: {
        section_id: Property.Dropdown({
            displayName: 'Section',
            description: 'Select the section to create the note in',
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
        html_content: Property.LongText({
            displayName: 'HTML Content',
            description: 'The HTML content of the note (inside <body>...</body>)',
            required: true
        })
    },
    async run(context) {
        const { section_id, title, html_content } = context.propsValue;

        // Build HTML for the note
        const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta name="created" content="${new Date().toISOString()}"/>
  </head>
  <body>
    ${html_content}
  </body>
</html>
        `.trim();

        // Prepare multipart form data
        const boundary = "NotePartBoundary" + Date.now();
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
            throw new Error(`Failed to create note: ${JSON.stringify(response.body)}`);
        }

        return response.body;
    }
});