import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { deftformAuth } from '../auth';
import { deftformApiCall, DeftformCommon } from '../common';

export const getFormFields = createAction({
    auth: deftformAuth,
    name: 'get_form_fields',
    displayName: 'Get Form Fields',
    description: 'Retrieves only the fields of a specific form. Great for understanding the structure before building automations.',
    props: {
        formId: DeftformCommon.formDropdown,
    },
    async run(context) {
        const response = await deftformApiCall<{ data: any[] }>({
            token: context.auth as unknown as string,
            method: HttpMethod.GET,
            path: `/forms/${context.propsValue.formId}/fields`,
        });

        return response.body.data.map((field) => ({
            id: field.id ?? null,
            name: field.name ?? null,
            label: field.label ?? null,
            type: field.type ?? null,
            required: field.required ?? null,
            options: Array.isArray(field.options) ? field.options.join(', ') : null,
            default_value: field.default_value ?? null,
            placeholder: field.placeholder ?? null,
            validation: field.validation ?? null,
        }));
    },
});

