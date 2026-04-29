import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { deftformAuth } from '../auth';
import { deftformApiCall, DeftformCommon } from '../common';

export const getSubmissionPdf = createAction({
    auth: deftformAuth,
    name: 'get_submission_pdf',
    displayName: 'Get Submission PDF',
    description: 'Generates a PDF download link for a specific form submission by its unique response UUID.',
    props: {
        formId: DeftformCommon.formDropdown,
        responseUuid: Property.ShortText({
            displayName: 'Response UUID',
            description: 'The unique identifier of the submission. You can find this in the form responses list.',
            required: true,
        }),
    },
    async run(context) {
        const response = await deftformApiCall<{ pdf_url?: string; url?: string }>({
            token: context.auth as unknown as string,
            method: HttpMethod.GET,
            path: `/response/${context.propsValue.responseUuid}/pdf`,
        });

        return {
            pdf_url: response.body.pdf_url ?? response.body.url ?? null,
            response_uuid: context.propsValue.responseUuid,
        };
    },
});
