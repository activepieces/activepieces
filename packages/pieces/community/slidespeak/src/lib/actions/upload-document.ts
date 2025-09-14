import { createAction, Property, ApFile } from "@activepieces/pieces-framework";
import { HttpMethod, HttpMessageBody } from "@activepieces/pieces-common";
import { makeRequest, makeRequestMultipart } from "../common/client";
import { slidespeakAuth } from "../common/auth";

// Helper function to delay execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const uploadDocument = createAction({
    auth: slidespeakAuth,
    name: 'upload_document',
    displayName: 'Upload Document',
    description: 'Uploads a document file to SlideSpeak for later use in presentation generation.',
    props: {
        file: Property.File({
            displayName: 'Document File',
            description: 'The document to upload (.pptx, .doc, .xlsx, .pdf, etc.).',
            required: true,
        }),
    },

    async run(context) {
        const { auth, propsValue } = context;

        // 1. Upload the document
        const body: HttpMessageBody = new FormData();
        const fileData = propsValue.file as ApFile;
        const fileBuffer = Buffer.from(fileData.base64, 'base64');
        body.append('file', new Blob([fileBuffer]), fileData.filename);

        const startResponse = await makeRequestMultipart<{ task_id: string }>(
            auth,
            '/document/upload',
            body
        );

        const taskId = startResponse.task_id;

        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
            const statusResponse = await makeRequest<{
                task_status: string;
                task_result: string | null;
                task_info: string | object | null;
            }>(
                auth,
                HttpMethod.GET,
                `/task_status/${taskId}`
            );

            if (statusResponse.task_status === 'SUCCESS') {
                return {
                    documentId: statusResponse.task_result,
                    status: statusResponse
                };
            }

            if (statusResponse.task_status === 'FAILURE') {
                throw new Error(`Document processing failed: ${JSON.stringify(statusResponse.task_info)}`);
            }
            

            await sleep(3000); 
            attempts++;
        }

        throw new Error("Document processing timed out after 3 minutes.");
    },
});