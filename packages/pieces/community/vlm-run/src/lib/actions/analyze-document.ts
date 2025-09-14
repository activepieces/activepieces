import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { vlmRunAuth } from "../common/auth";
import { makeRequest } from "../common/client";

export const analyzeDocumentAction = createAction({
    auth: vlmRunAuth,
    name: 'analyze_document',
    displayName: 'Analyze Document',
    description: 'Process a document (PDF, DOCX, etc.), extracting structured data or text.',
    props: {
        domain: Property.StaticDropdown({
            displayName: 'Domain',
            description: 'The analysis to perform on the document.',
            required: true,
            options: {
                options: [
                    { label: 'Invoice', value: 'document.invoice' },
                    { label: 'Markdown', value: 'document.markdown' },
                    { label: 'Receipt', value: 'document.receipt' },
                    { label: 'Resume', value: 'document.resume' },
                    { label: 'US Driver\'s License', value: 'document.us-drivers-license' },
                    { label: 'Layout Detection', value: 'document.layout-detection' },
                    { label: 'Healthcare - Patient Referral', value: 'healthcare.patient-referral' },
                    { label: 'Healthcare - Patient Identification', value: 'healthcare.patient-identification' },
                    { label: 'Healthcare - Physician Order', value: 'healthcare.physician-order' },
                    { label: 'Healthcare - Claims Processing', value: 'healthcare.claims-processing' },
                    { label: 'Construction - Markdown', value: 'construction.markdown' },
                    { label: 'Construction - Blueprint', value: 'construction.blueprint' },
                ],
            },
        }),
        url: Property.ShortText({
            displayName: 'Document URL',
            description: 'The public URL of the document to process. **Provide either a URL or a File ID.**',
            required: false,
        }),
        file_id: Property.ShortText({
            displayName: 'File ID',
            description: 'The ID of a previously uploaded document. **Provide either a URL or a File ID.**',
            required: false,
        }),
        batch: Property.Checkbox({
            displayName: 'Batch Mode (Async)',
            description: 'If true, the job runs asynchronously in the background. Recommended for large documents.',
            required: false,
            defaultValue: true,
        }),
        callback_url: Property.ShortText({
            displayName: 'Callback URL',
            description: 'An optional URL to send a POST request to when the async job is complete.',
            required: false,
        }),
        metadata: Property.Json({
            displayName: 'Metadata',
            description: 'Optional JSON metadata to pass to the model.',
            required: false,
        }),
        config: Property.Json({
            displayName: 'Config',
            description: 'Optional JSON config for VLM generation.',
            required: false,
        }),
    },
    async run(context) {
        const { domain, url, file_id, batch, callback_url, metadata, config } = context.propsValue;


        if (!url && !file_id) {
            throw new Error("Validation Error: You must provide a 'Document URL' or a 'File ID'.");
        }

        const requestBody = {
            domain,
            url: url || undefined,
            file_id: file_id || undefined,
            batch,
            callback_url: callback_url || undefined,
            metadata: metadata || undefined,
            config: config || undefined,
        };


        return await makeRequest(
            context.auth,
            HttpMethod.POST,
            '/document/generate',
            requestBody
        );
    },
});