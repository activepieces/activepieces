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
            return {
                id: i['id'] ?? null,
                uuid: i['uuid'] ?? null,
                form_id: i['form_id'] ?? null,
                created_at: i['created_at'] ?? null,
                updated_at: i['updated_at'] ?? null,
                ...Object.fromEntries(
                    Object.entries((i['fields'] as Record<string, unknown>) || {}).map(([k, v]) => [
                        `field_${k}`,
                        typeof v === 'object' ? JSON.stringify(v) : v,
                    ]),
                ),
            };
        });
    },
});
