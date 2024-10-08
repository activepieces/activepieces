import { createAction, Property } from '@activepieces/pieces-framework';
import { pdf } from "pdf-to-img";

export const convertPdfToImages = createAction({
    name: 'convertPdfToImages',
    displayName: 'Convert PDF to Images',
    description: 'Convert a PDF file to one or more image files',
    props: {
        pdfFile: Property.File({
            displayName: 'PDF File',
            description: 'Select a PDF file to convert',
            required: true,
        }),
    },
    async run(context) {

        const pdfFile = context.propsValue.pdfFile;
        const pdfBytes = pdfFile.data; // Get the PDF file data

        // Convert PDF to images using pdf-to-img
        const imageReferences = [];
        const document = await pdf(pdfBytes);

        let counter = 1;
        for await (const imageBuffer of document) {
            // Write the image file and return reference
            const fileReference = await context.files.write({
                fileName: `page_${counter}.png`,
                data: imageBuffer,
            });

            imageReferences.push(fileReference);
            counter++;
        }

        return imageReferences;
    },
});
