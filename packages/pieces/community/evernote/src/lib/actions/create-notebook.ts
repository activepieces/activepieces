import {
    createAction,
    Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const createNotebook = createAction({
    name: 'create_notebook',
    displayName: 'Create Notebook',
    description: 'Provision a project notebook when a new project record is created.',
    props: {
        name: Property.ShortText({
            displayName: 'Notebook Name',
            description: 'The name for the new notebook. This must be unique.',
            required: true,
        }),
        stack: Property.ShortText({
            displayName: 'Stack Name (Optional)',
            description: 'If you want to group this notebook under a stack, provide the stack name.',
            required: false,
        })
    },
    async run(context) {
        const { name, stack } = context.propsValue;
        const token = context.auth as string;

        const notebookPayload: {
            name: string;
            stack?: string;
        } = {
            name: name,
        };

        if (stack) {
            notebookPayload.stack = stack;
        }

        // Corresponds to NoteStore.createNotebook
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://www.evernote.com/api/v1/notebooks',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: notebookPayload,
        });

        return response.body;
    },
});