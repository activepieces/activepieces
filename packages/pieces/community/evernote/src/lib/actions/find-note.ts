import {
    createAction,
    Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const findNote = createAction({
    name: 'find_note',
    displayName: 'Find a Note',
    description: 'Finds a note by title, optionally limited by notebook and tags.',
    props: {
        title: Property.ShortText({
            displayName: 'Title',
            description: 'The title of the note to search for.',
            required: true,
        }),
        notebookGuid: Property.Dropdown({
            displayName: 'Notebook (Optional)',
            description: 'Limit the search to a specific notebook.',
            required: false,
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
        tags: Property.MultiSelectDropdown({
            displayName: 'Tags (Optional)',
            description: 'Limit the search to notes that have these tags.',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return { disabled: true, placeholder: 'Please provide authentication first.', options: [] };
                }
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
        const { title, notebookGuid, tags } = context.propsValue;
        const token = context.auth as string;

        const searchWords = `intitle:"${title}"`;

        const queryParams: { [key: string]: string } = {
            words: searchWords,
        };

        if (notebookGuid) {
            // Corrected from dot notation to bracket notation
            queryParams['notebookGuid'] = notebookGuid as string;
        }

        if (tags && (tags as string[]).length > 0) {
            // Corrected from dot notation to bracket notation
            queryParams['tagGuids'] = (tags as string[]).join(',');
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://www.evernote.com/api/v1/notes',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            queryParams: queryParams,
        });

        return response.body;
    },
});