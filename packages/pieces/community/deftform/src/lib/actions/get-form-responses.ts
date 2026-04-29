import { createAction, Property } from '@activepieces/pieces-framework';
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
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of responses to return (default: 100).',
            required: false,
            defaultValue: 100,
        }),
    },
    async run(context) {
        const response = await deftformApiCall<{ data: any[] }>({
            token: context.auth as unknown as string,
            method: HttpMethod.GET,
            path: `/responses/${context.propsValue.formId}`,
            queryParams: context.propsValue.limit
                ? { limit: String(context.propsValue.limit) }
                : undefined,
        });

        return response.body.data.map((item) => ({
            id: item.id ?? null,
            uuid: item.uuid ?? null,
            form_id: item.form_id ?? null,
            created_at: item.created_at ?? null,
            updated_at: item.updated_at ?? null,
            ...Object.fromEntries(
                Object.entries(item.fields || {}).map(([k, v]) => [
                    `field_${k}`,
                    typeof v === 'object' ? JSON.stringify(v) : v,
                ]),
            ),
        }));
    },
});

