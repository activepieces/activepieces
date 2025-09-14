import { createAction, Property, ApFile } from "@activepieces/pieces-framework";
import { makeRequestMultipart } from "../common/client";
import { slidespeakAuth } from "../common/auth";
import { HttpMessageBody, httpClient } from "@activepieces/pieces-common";

export const editPresentation = createAction({
    auth: slidespeakAuth,
    name: 'edit_presentation',
    displayName: 'Edit Presentation',
    description: 'Update an existing PPTX with a JSON config (e.g. replace text or images in slides).',
    props: {
        pptx_file: Property.File({
            displayName: 'PowerPoint File (.pptx)',
            description: 'The .pptx file you wish to edit.',
            required: true,
        }),
        replacements: Property.Array({
            displayName: 'Replacements',
            description: 'A list of shapes to replace and their new content.',
            required: true,
            properties: {
                shape_name: Property.ShortText({
                    displayName: 'Shape Name',
                    description: 'The name of the shape in the presentation to target.',
                    required: true,
                }),
                content: Property.LongText({
                    displayName: 'New Content',
                    description: 'The new text or image URL for the shape.',
                    required: true,
                }),
            }
        })
    },

    async run(context) {
        const { auth, propsValue } = context;

        const body: HttpMessageBody = new FormData();
        

        const fileData = propsValue.pptx_file as ApFile;
        const fileBuffer = Buffer.from(fileData.base64, 'base64');
        body.append('pptx_file', new Blob([fileBuffer]), fileData.filename);
        
    
        const config = {
            replacements: propsValue.replacements,
        };
        body.append('config', JSON.stringify(config));
        
        const response = await makeRequestMultipart<{ url: string }>(
            auth,
            '/presentation/edit',
            body
        );

        return response;
    },
});