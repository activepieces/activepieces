import { createAction, Property } from "@activepieces/pieces-framework";
import { docsCommon } from "../common";

export const createDocument = createAction({
    name: 'create_document',
    description: 'Create a document on Google Docs',
    displayName: 'Create Document',
    props: {
        authentication: docsCommon.authentication,
        title: docsCommon.title,
        body: docsCommon.body
    },
    async run(context) {
        const document = await docsCommon.createDocument(context.propsValue.title, context.propsValue.authentication.access_token);
        const response = await docsCommon.writeToDocument(document.documentId, context.propsValue.body, context.propsValue.authentication.access_token);

        return response;
    }
});
