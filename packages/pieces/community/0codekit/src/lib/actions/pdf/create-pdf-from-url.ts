import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitFiles } from '../../common/files';
import { zeroCodeKitPdf } from '../../common/pdf';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const createPdfFromUrlAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'create_pdf_from_url',
    classification: 'WRITE',
    displayName: 'Creates a PDF file from URL',
    description: 'Capture a web page as a PDF file.',
    audience: 'both',
    aiMetadata: {
        description:
            'Open a public web page in a browser and print it to a PDF file. Pass the full page address including https://. Pages behind a login cannot be captured. Creates a new file on every call.',
        idempotent: false,
    },
    props: {
        url: Property.ShortText({
            displayName: 'Web Page URL',
            description: 'The full address of a public web page, including `https://`.',
            required: true,
            placeholder: 'https://example.com',
        }),
        fileName: zeroCodeKitPdf.fileName({ description: 'Name of the PDF file to create. Defaults to `webpage.pdf`.' }),
        ...zeroCodeKitPdf.renderProps(),
    },
    outputSchema: filesStorageOutputSchemas.createdPdf,
    async run({ auth, propsValue, files }) {
        const url = zeroCodeKitPdf.clean(propsValue.url);
        if (url === undefined || !/^https?:\/\//i.test(url)) {
            throw new Error('Web Page URL must be a full address starting with http:// or https://.');
        }
        const data = await zeroCodeKitFiles.postForBinary({
            apiKey: auth.secret_text,
            path: '/pdf/html',
            body: {
                url,
                getAsUrl: false,
                options: zeroCodeKitPdf.renderOptions(propsValue),
            },
        });
        return zeroCodeKitFiles.save({
            files,
            fileName: zeroCodeKitFiles.withExtension({
                name: zeroCodeKitPdf.baseName({ name: propsValue.fileName, fallback: 'webpage' }),
                extension: 'pdf',
            }),
            data,
        });
    },
});
