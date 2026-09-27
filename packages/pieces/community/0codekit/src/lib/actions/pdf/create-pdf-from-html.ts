import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitFiles } from '../../common/files';
import { zeroCodeKitPdf } from '../../common/pdf';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const createPdfFromHtmlAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'create_pdf_from_html',
    classification: 'WRITE',
    displayName: 'Creates a PDF from HTML',
    description: 'Render HTML markup into a PDF file.',
    audience: 'both',
    aiMetadata: {
        description:
            'Render an HTML document (inline CSS and absolute image URLs supported) into a PDF and return it as a file. Pass the HTML source itself, not a web address; use "Creates a PDF file from URL" for live pages. Creates a new file on every call.',
        idempotent: false,
    },
    props: {
        html: Property.LongText({
            displayName: 'HTML',
            description: 'The HTML to render. Use inline styles and absolute image URLs.',
            required: true,
            placeholder: '<h1>Invoice</h1><p style="color: gray">Thank you!</p>',
        }),
        fileName: zeroCodeKitPdf.fileName({ description: 'Name of the PDF file to create. Defaults to `document.pdf`.' }),
        ...zeroCodeKitPdf.renderProps(),
    },
    outputSchema: filesStorageOutputSchemas.createdPdf,
    async run({ auth, propsValue, files }) {
        const html = zeroCodeKitPdf.clean(propsValue.html);
        if (html === undefined) {
            throw new Error('HTML is required.');
        }
        const data = await zeroCodeKitFiles.postForBinary({
            apiKey: auth.secret_text,
            path: '/pdf/html',
            body: {
                html,
                getAsUrl: false,
                options: zeroCodeKitPdf.renderOptions(propsValue),
            },
        });
        return zeroCodeKitFiles.save({
            files,
            fileName: zeroCodeKitFiles.withExtension({
                name: zeroCodeKitPdf.baseName({ name: propsValue.fileName, fallback: 'document' }),
                extension: 'pdf',
            }),
            data,
        });
    },
});
