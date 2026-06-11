import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { deftformAuth } from '../auth';
import { deftformApiCall } from '../common';

export const getSubmissionPdf = createAction({
    auth: deftformAuth,
    name: 'get_submission_pdf',
    displayName: 'Get Submission PDF',
    description: 'Generates a PDF download link for a specific form submission by its unique response UUID.',
    audience: 'both',
    aiMetadata: { description: 'Get a downloadable PDF link for a single form submission, identified by its response UUID (obtainable from Get Form Responses). Use it when you need a printable or shareable copy of one response. Read-only and idempotent.', idempotent: true },
    props: {
        responseUuid: Property.ShortText({
            displayName: 'Response UUID',
            description: 'The unique identifier of the submission. You can find this in the form responses list.',
            required: true,
        }),
    },
    async run(context) {
        const response = await deftformApiCall<{ data?: { pdf_url?: string; url?: string } }>({
            token: context.auth.secret_text,
            method: HttpMethod.GET,
            path: `/response/${context.propsValue.responseUuid}/pdf`,
        });

        return {
            pdf_url: response.body.data?.pdf_url ?? response.body.data?.url ?? null,
            response_uuid: context.propsValue.responseUuid,
        };
    },
});
