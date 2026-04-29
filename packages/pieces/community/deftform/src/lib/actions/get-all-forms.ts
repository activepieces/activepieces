import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { deftformAuth } from '../auth';
import { deftformApiCall } from '../common';

export const getAllForms = createAction({
    auth: deftformAuth,
    name: 'get_all_forms',
    displayName: 'Get All Forms and Fields',
    description: 'Lists all forms in your workspace, including their fields.',
    props: {},
    async run(context) {
        const response = await deftformApiCall<{ data: any[] }>({
            token: context.auth as unknown as string,
            method: HttpMethod.GET,
            path: '/forms',
        });

        return response.body.data.map((form) => ({
            id: form.id ?? null,
            name: form.name ?? null,
            description: form.description ?? null,
            is_closed: form.is_closed ?? null,
            slug: form.slug ?? null,
            created_at: form.created_at ?? null,
            updated_at: form.updated_at ?? null,
            fields_count: Array.isArray(form.fields) ? form.fields.length : null,
            fields: Array.isArray(form.fields)
                ? form.fields.map((f: any) => f.label || f.name || f.id).join(', ')
                : null,
            responses_limit: form.responses_limit ?? null,
            admin_email_subject: form.admin_email_subject ?? null,
        }));
    },
});

