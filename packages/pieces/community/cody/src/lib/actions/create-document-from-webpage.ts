import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';

export const createDocumentFromWebpageAction = createAction({
    auth: codyAuth,
    name: 'create_document_from_webpage',
    displayName: 'Create Document From Webpage',
    description: 'Scrape a web page URL into a new Cody knowledge-base document.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Scrapes a web page at the given URL into a new Cody knowledge-base document, so a bot can answer from it. Use to ingest a page by URL; for inline text use Create Text Document and for a file use Upload File to Knowledge Base. Resolve the folder ID via List Folders first. Ingestion is asynchronous (the document starts in status pending) and consumes the workspace embedding quota, so poll Get Document for status. Requires a URL and a folder ID; creates a new document each call, so it is not idempotent.',
        idempotent: false,
    },
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description:
                "The full URL of the web page to scrape, including protocol, e.g. 'https://example.com/page'.",
            required: true,
        }),
        folder_id: Property.ShortText({
            displayName: 'Folder ID',
            description: 'The ID of the folder to create the document in. Resolve via List Folders.',
            required: true,
        }),
    },
    async run(context) {
        const { url, folder_id } = context.propsValue;
        const apiKey = context.auth;

        return await codyClient.post(apiKey, `/documents/webpage`, {
            url,
            folder_id,
        });
    },
});
