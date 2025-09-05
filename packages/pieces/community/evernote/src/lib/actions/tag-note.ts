import {
    createAction,
    Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const tagNote = createAction({
    name: 'tag_note',
    displayName: 'Tag Note',
    description: 'Auto‐label notes from forms.',
    props: {
        notebookGuid: Property.Dropdown({
            displayName: 'Notebook',
            description: 'The notebook containing the note you want to tag.',
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
            displayName: 'Note to Tag',
            description: 'The specific note to apply tags to.',
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
                return { disabled: true, placeholder: 'Error fetching notes.', options: [] };
            },
        }),
        tags: Property.MultiSelectDropdown({
            displayName: 'Tags',
            description: 'Select one or more tags to apply to the note.',
            required: true,
            refreshers: [], // This line fixes the error
            options: async ({ auth }) => {
                if (!auth) {
                    return { disabled: true, placeholder: 'Please provide authentication first.', options: [] };
                }
                // Corresponds to NoteStore.listTags
                const response = await httpClient.sendRequest<{ name: string; guid: string }[]>({
                    method: HttpMethod.GET,
                    url: 'https://www.evernote.com/api/v1/tags',
                    headers: { Authorization: `Bearer ${auth}` },
                });
                if (response.status === 200) {
                    return {
                        disabled: false,
                        options: response.body.map((tag) => ({ label: tag.name, value: tag.guid })),
                    };
                }
                return { disabled: true, placeholder: 'Error fetching tags.', options: [] };
            }
        })
    },
    async run(context) {
        const { noteGuid, tags: newTagGuids } = context.propsValue;
        const token = context.auth as string;

        // 1. Get the current note to find its title and existing tags
        const existingNote = await httpClient.sendRequest<{ title: string; tagGuids?: string[] }>({
            method: HttpMethod.GET,
            url: `https://www.evernote.com/api/v1/notes/${noteGuid}`,
            headers: { Authorization: `Bearer ${token}` },
        });

        if (existingNote.status !== 200) {
            throw new Error(`Failed to fetch note ${noteGuid}. Status: ${existingNote.status}`);
        }
        
        const existingTagGuids = existingNote.body.tagGuids || [];

        // 2. Combine existing tags with new tags, removing duplicates
        const combinedGuids = [...new Set([...existingTagGuids, ...newTagGuids])];

        // 3. Build the update payload and update the note
        const updatePayload = {
            guid: noteGuid,
            title: existingNote.body.title, // API requires title for an update
            tagGuids: combinedGuids,
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