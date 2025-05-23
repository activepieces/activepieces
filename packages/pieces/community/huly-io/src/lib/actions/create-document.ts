import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';
import { hulyIoAuth } from '../../index';
import { DocumentClasses, DocumentSpaces } from '../common/constants';

export const createDocument = createAction({
    auth: hulyIoAuth,
    name: 'create_document',
    displayName: 'Create Document',
    description: 'Create a new document in Huly.io',
    props: {
        className: Property.StaticDropdown({
            displayName: 'Class',
            description: 'The class of the document to create',
            required: true,
            options: {
                options: [
                    { label: 'Document', value: DocumentClasses.Document },
                    { label: 'Folder', value: DocumentClasses.Folder },
                ]
            },
            defaultValue: DocumentClasses.Document,
        }),
        space: Property.StaticDropdown({
            displayName: 'Space',
            description: 'The space to create the document in',
            required: true,
            options: {
                options: [
                    { label: 'Documents', value: DocumentSpaces.Documents },
                ]
            },
            defaultValue: DocumentSpaces.Documents,
        }),
        attributes: Property.Object({
            displayName: 'Attributes',
            description: 'The attributes of the document to create (can include title, content, folderId, tags, etc.)',
            required: true,
        }),
        id: Property.ShortText({
            displayName: 'ID',
            description: 'Optional ID of the document, if not provided, a new ID will be generated',
            required: false,
        }),
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);

        try {
            // Create a copy of attributes to avoid modifying the original
            const attributes = { ...propsValue.attributes };

            // If ID is provided, include it in the attributes
            if (propsValue.id) {
                attributes._id = propsValue.id;
            }

            // Using createDoc method according to our client implementation
            const documentId = await client.createDoc(
                propsValue.className,  // Class of the object
                propsValue.space,      // Space of the object
                attributes             // Attributes of the object (including optional ID)
            );

            // Fetch the created document to return complete data
            const documentData = await client.findOne(propsValue.className, { _id: documentId });

            await client.disconnect();
            return documentData || { id: documentId };
        } catch (error) {
            await client.disconnect();
            throw error;
        }
    },
});
