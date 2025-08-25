import {
    createAction,
    Property,
} from '@activepieces/pieces-framework';

// Corrected import syntax to match the library's structure
import * as Evernote from 'evernote';

export const createNotebook = createAction({
    name: 'create_notebook',
    displayName: 'Create Notebook',
    description: 'Creates a new notebook in your Evernote account.',
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

        // Initialize the Evernote client
        // The sandbox: false parameter ensures you're using the production environment
        const client = new Evernote.Client({ token: token, sandbox: false });
        const noteStore = await client.getNoteStore();

        // Create a notebook object in the format Evernote's API expects
        const notebook = new Evernote.Types.Notebook();
        notebook.name = name;

        if (stack) {
            notebook.stack = stack;
        }

        try {
            // Use the SDK to call the createNotebook function
            const createdNotebook = await noteStore.createNotebook(notebook);
            return createdNotebook;
        } catch (error) {
            // The Evernote SDK throws detailed errors.
            // It's good practice to log them for easier debugging.
            console.error("Evernote API Error:", error);
            // Re-throw the error to let Activepieces handle it
            throw error;
        }
    },
});