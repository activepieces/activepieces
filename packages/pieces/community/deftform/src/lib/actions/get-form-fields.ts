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
        const response = await deftformApiCall<{ data: unknown[] }>({
            token: context.auth.secret_text,
            method: HttpMethod.GET,
            path: `/forms/${context.propsValue.formId}/fields`,
        });

        return response.body.data.map((field) => {
            const f = field as Record<string, unknown>;
            return {
                id: f['id'] ?? null,
                name: f['name'] ?? null,
                label: f['label'] ?? null,
                type: f['type'] ?? null,
                required: f['required'] ?? null,
                options: Array.isArray(f['options']) ? f['options'] : null,
                default_value: f['default_value'] ?? null,
                placeholder: f['placeholder'] ?? null,
                validation: f['validation'] ?? null,
            };
        });
    },
});
