import { googleDocsAuth } from '../../index';
import { Property, createAction } from "@activepieces/pieces-framework";
import { docsCommon } from '../common';


export const createDocumentBasedOnTemplate = createAction({
    auth: googleDocsAuth,
    name: 'create_document_based_on_template',
    description: 'Create a document on Google Docs based on a template',
    displayName: 'Create Document Based on Template',
    props: {
        title: docsCommon.title,
        template: Property.LongText({
            displayName: 'Template',
            description: 'Variables should be in the format: [[variableName]]',
            required: true,
        }),
        values: Property.Object({
            displayName: 'Values',
            description: 'Dont include the "[[]]", only the key name and its value',
            required: true,
        }),
    },
    async run(context) {
        
        const template = context.propsValue.template;
        const values = context.propsValue.values;
        let body = template;
        
        for (const key in values) {
            const value = String(values[key]);
            body = body.replace(`[[${key}]]`, value);
        }

        const document = await docsCommon.createDocument(context.propsValue.title, context.auth.access_token);
        const response = await docsCommon.writeToDocument(document.documentId, body, context.auth.access_token);
        
        return response;
    }
});