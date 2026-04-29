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
            description: 'Key-value pairs where each key is the field ID and the value is the user input.',
            required: true,
        }),
    },
    async run(context) {
        const response = await deftformApiCall<{ id?: string; uuid?: string; message?: string }>({
            token: context.auth as unknown as string,
            method: HttpMethod.POST,
            path: `/forms/${context.propsValue.formId}/response`,
            body: context.propsValue.responseData,
        });

        return {
            id: response.body.id ?? null,
            uuid: response.body.uuid ?? null,
            message: response.body.message ?? 'Response submitted successfully.',
        };
    },
});
