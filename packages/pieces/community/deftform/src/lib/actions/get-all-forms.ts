import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { deftformAuth } from '../auth';
import { deftformApiCall } from '../common';

export const getAllForms = createAction({
    auth: deftformAuth,
    name: 'get_all_forms',
    displayName: 'Get All Forms and Fields',
    description: 'Lists all forms in your workspace, including their fields.',
    audience: 'both',
    aiMetadata: { description: 'List every form in the workspace along with each form fields and metadata (id, name, slug, closed status, response limit). Use it to discover available forms and their ids before targeting a specific form. Read-only and idempotent; takes no input.', idempotent: true },
    props: {},
    async run(context) {
        const response = await deftformApiCall<{ data: unknown[] }>({
            token: context.auth.secret_text,
            method: HttpMethod.GET,
            path: '/forms',
        });

        return response.body.data.map((form) => {
            const f = form as Record<string, unknown>;
            const fieldsRaw = Array.isArray(f['fields'])
                ? (f['fields'] as Record<string, unknown>[])
                : [];
            return {
                id: f['id'] ?? null,
                name: f['name'] ?? null,
                description: f['description'] ?? null,
                is_closed: f['is_closed'] ?? null,
                slug: f['slug'] ?? null,
                created_at: f['created_at'] ?? null,
                updated_at: f['updated_at'] ?? null,
                fields_count: fieldsRaw.length,
                fields: fieldsRaw.map((field) => ({
                    id: field['id'] ?? null,
                    label: field['label'] ?? field['name'] ?? null,
                    type: field['type'] ?? null,
                })),
                responses_limit: f['responses_limit'] ?? null,
                admin_email_subject: f['admin_email_subject'] ?? null,
            };
        });
    },
});
