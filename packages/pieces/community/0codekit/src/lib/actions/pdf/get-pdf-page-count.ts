import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitFiles } from '../../common/files';
import { zeroCodeKitPdf } from '../../common/pdf';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const getPdfPageCountAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'get_pdf_page_count',
    classification: 'READ',
    displayName: 'Gets PDF page count',
    description: 'Count the pages in a PDF file.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the number of pages in a PDF. Pass the PDF as a file from an earlier step or as a public URL to the file. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        pdf: zeroCodeKitPdf.pdfFile({
            displayName: 'PDF',
            description: 'The PDF file to count, from an earlier step or a public URL.',
        }),
    },
    outputSchema: filesStorageOutputSchemas.pdfPageCount,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<PageCountResponse>({
            apiKey: auth.secret_text,
            path: '/pdf/count',
            body: {
                buffer: zeroCodeKitFiles.toBase64(propsValue.pdf),
            },
        });
        return { page_count: response.pageCount ?? null };
    },
});

type PageCountResponse = {
    pageCount?: number;
};
