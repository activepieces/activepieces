import {
    createAction,
    Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const updateNote = createAction({
    name: 'update_note',
    displayName: 'Update Note',
    description: 'Updates an existing note.',
    props: {
        notebookGuid: Property.Dropdown({
            displayName: 'Notebook',
            description: 'The notebook containing the note you want to update.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please provide authentication first.',
                        options: [],
                    };
                }
                const response = await httpClient.sendRequest<{ name: string; guid: string }[]>({
                    method: HttpMethod.GET,
                    url: 'https://www.evernote.com/api/v1/notebooks',
                    headers: { Authorization: `Bearer ${auth}` },
                });
                if (response.status === 200) {
                    return {
                        disabled: false,
                        options: response.body.map((notebook) => ({
                            label: notebook.name,
                            value: notebook.guid,
                        })),
                    };
                }
                return {
                    disabled: true,
                    placeholder: 'Error fetching notebooks.',
                    options: [],
                };
            },
        }),
        noteGuid: Property.Dropdown({
            displayName: 'Note to Update',
            description: 'The specific note to update.',
            required: true,
            refreshers: ['notebookGuid'],
            options: async ({ auth, notebookGuid }) => {
                if (!auth || !notebookGuid) {
                    return {
                        disabled: true,
                        placeholder: 'Please select a notebook first.',
                        options: [],
                    };
                }
                const response = await httpClient.sendRequest<{ title: string; guid: string }[]>({
                    method: HttpMethod.GET,
                    url: `https://www.evernote.com/api/v1/notes?notebookGuid=${notebookGuid}`,
                    headers: { Authorization: `Bearer ${auth}` },
                });
                if (response.status === 200) {
                    return {
                        disabled: false,
                        options: response.body.map((note) => ({
                            label: note.title,
                            value: note.guid,
                        })),
                    };
                }
                return {
                    disabled: true,
                    placeholder: 'Error fetching notes from this notebook.',
                    options: [],
                };
            },
        }),
        title: Property.ShortText({
            displayName: 'New Title',
            description: "The note's title. This is required for any update.",
            required: true,
        }),
        content: Property.LongText({
            displayName: 'New Content',
            description: 'The new body for the note. Leave blank to keep the existing content.',
            required: false,
        }),
        moveToNotebook: Property.Dropdown({
            displayName: 'Move to Notebook (Optional)',
            description: 'Select a different notebook to move this note to.',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return { disabled: true, placeholder: 'Auth is required', options: [] };
                }
                const response = await httpClient.sendRequest<{ name: string; guid: string }[]>({
                    method: HttpMethod.GET,
                    url: 'https://www.evernote.com/api/v1/notebooks',
                    headers: { Authorization: `Bearer ${auth}` },
                });
                if (response.status === 200) {
                    return {
                        disabled: false,
                        options: response.body.map((notebook) => ({
                            label: notebook.name,
                            value: notebook.guid,
                        })),
                    };
                }
                return { disabled: true, placeholder: 'Error fetching notebooks', options: [] };
            },
        }),
    },
    async run(context) {
        const { noteGuid, title, content, moveToNotebook } = context.propsValue;
        const token = context.auth as string;

        const notePayload: {
            guid: string;
            title: string;
            content?: string;
            notebookGuid?: string;
        } = {
            guid: noteGuid,
            title: title,
        };

        if (content) {
            notePayload.content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
<en-note>${content.replace(/\n/g, '<br/>')}</en-note>`;
        }

        if (moveToNotebook) {
            notePayload.notebookGuid = moveToNotebook;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://www.evernote.com/api/v1/notes',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: notePayload,
        });

        return response.body;
    },
});