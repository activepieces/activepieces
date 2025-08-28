import {
    createAction,
    Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const appendToNote = createAction({
    name: 'append_to_note',
    displayName: 'Append to Note',
    description: 'Continuously append daily standup updates to a single rolling note.',
    props: {
        notebookGuid: Property.Dropdown({
            displayName: 'Notebook',
            description: 'The notebook containing the note you want to append to.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return { disabled: true, placeholder: 'Please provide authentication first.', options: [] };
                }
                const response = await httpClient.sendRequest<{ name: string; guid: string }[]>({
                    method: HttpMethod.GET,
                    url: 'https://www.evernote.com/api/v1/notebooks',
                    headers: { Authorization: `Bearer ${auth}` },
                });
                if (response.status === 200) {
                    return {
                        disabled: false,
                        options: response.body.map((notebook) => ({ label: notebook.name, value: notebook.guid })),
                    };
                }
                return { disabled: true, placeholder: 'Error fetching notebooks.', options: [] };
            },
        }),
        noteGuid: Property.Dropdown({
            displayName: 'Note to Append To',
            description: 'The specific note to which content will be appended.',
            required: true,
            refreshers: ['notebookGuid'],
            options: async ({ auth, notebookGuid }) => {
                if (!auth || !notebookGuid) {
                    return { disabled: true, placeholder: 'Please select a notebook first.', options: [] };
                }
                const response = await httpClient.sendRequest<{ title: string; guid: string }[]>({
                    method: HttpMethod.GET,
                    url: `https://www.evernote.com/api/v1/notes?notebookGuid=${notebookGuid}`,
                    headers: { Authorization: `Bearer ${auth}` },
                });
                if (response.status === 200) {
                    return {
                        disabled: false,
                        options: response.body.map((note) => ({ label: note.title, value: note.guid })),
                    };
                }
                return { disabled: true, placeholder: 'Error fetching notes from this notebook.', options: [] };
            },
        }),
        content: Property.LongText({
            displayName: 'Content to Append',
            description: 'The text you want to add to the end of the note.',
            required: true,
        }),
    },
    async run(context) {
        const { noteGuid, content } = context.propsValue;
        const token = context.auth as string;

        // 1. Get the current note content and title
        const existingNote = await httpClient.sendRequest<{ title: string; content: string }>({
            method: HttpMethod.GET,
            url: `https://www.evernote.com/api/v1/notes/${noteGuid}?withContent=true`,
            headers: { Authorization: `Bearer ${token}` },
        });

        if (existingNote.status !== 200) {
            throw new Error(`Failed to fetch note ${noteGuid}. Status: ${existingNote.status}`);
        }

        // 2. Extract the content from inside the <en-note> tag (FIXED REGEX)
        const existingContentMatch = existingNote.body.content.match(/<en-note>([\s\S]*?)<\/en-note>/);
        const existingContent = existingContentMatch ? existingContentMatch[1] : '';

        // 3. Prepare the new content to be appended
        const formattedNewContent = content.replace(/\n/g, '<br/>');
        const appendBlock = `<hr/><div><b>Appended on ${new Date().toLocaleString()}:</b></div><div>${formattedNewContent}</div>`;
        
        // 4. Combine old and new content
        const finalContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
<en-note>${existingContent}${appendBlock}</en-note>`;

        // 5. Build the update payload and update the note
        const updatePayload = {
            guid: noteGuid,
            title: existingNote.body.title, // API requires the title for an update
            content: finalContent,
        };

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://www.evernote.com/api/v1/notes',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: updatePayload,
        });

        return response.body;
    },
});