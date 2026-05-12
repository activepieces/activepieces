import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { deftformAuth } from '../auth';
import { deftformApiCall, DeftformCommon } from '../common';

export const getFormResponses = createAction({
    auth: deftformAuth,
    name: 'get_form_responses',
    displayName: 'Get Form Responses',
    description: 'Retrieves all submissions (responses) for a specific form. Useful for reporting and data exports.',
    props: {
        formId: DeftformCommon.formDropdown,
    },
    async run(context) {
        const response = await deftformApiCall<{ data: unknown[] }>({
            token: context.auth.secret_text,
            method: HttpMethod.GET,
            path: `/responses/${context.propsValue.formId}`,
        });

        return response.body.data.map((item) => {
            const i = item as Record<string, unknown>;
            const responseFields: Record<string, unknown> = {};
            const responses = i['responses'] as Array<{ key: string; value: unknown }> | undefined;
            if (responses) {
                for (const r of responses) {
                    const value = r.value;
                    responseFields[r.key] = Array.isArray(value)
                        ? value.map((v) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v))).join(', ')
                        : value ?? null;
                }
            }
            return {
                ...responseFields,
                id: i['id'] ?? null,
                uuid: i['uuid'] ?? null,
                number: i['number'] ?? null,
                number_formatted: i['number_formatted'] ?? null,
                form_id: i['form_id'] ?? null,
                created_at: i['created_at'] ?? null,
                updated_at: i['updated_at'] ?? null,
            };
        });
    },
});
