import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { deftformAuth } from '../auth';
import { deftformApiCall, DeftformCommon } from '../common';

export const addFormResponse = createAction({
    auth: deftformAuth,
    name: 'add_form_response',
    displayName: 'Add Form Response',
    description: `Submits a new response programmatically to a form. 
**Note:** This does **not** trigger email notifications to the form admin, unlike regular public submissions.`,
    props: {
        formId: DeftformCommon.formDropdown,
        responseData: Property.Object({
            displayName: 'Response Data',
            description: 'Key-value pairs where each key is the field UUID and the value is the user input.',
            required: true,
        }),
    },
    async run(context) {
        const response = await deftformApiCall<{ data?: { id?: string; uuid?: string } }>({
            token: context.auth.secret_text,
            method: HttpMethod.POST,
            path: `/forms/${context.propsValue.formId}/response`,
            body: { data: context.propsValue.responseData },
        });

        return {
            id: response.body.data?.id ?? null,
            uuid: response.body.data?.uuid ?? null,
            message: 'Response submitted successfully.',
        };
    },
});
