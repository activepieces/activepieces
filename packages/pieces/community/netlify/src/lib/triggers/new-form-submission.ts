import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netlifyAuth } from '../../index';
import { callNetlifyApi } from '../common';

interface Submission {
    id: string;
    // Add other relevant properties if needed
}

export const newFormSubmission = createTrigger({
    name: 'new_form_submission',
    auth: netlifyAuth,
    displayName: 'New Form Submission',
    description: 'Fires when a Netlify form submission is received.',
    props: {
        site_id: Property.Dropdown({
            displayName: 'Site',
            description: 'The Netlify site to monitor.',
            required: true,
            refreshers: [],
            async options(propsValue) {
                const { auth } = propsValue;
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your Netlify account first.',
                        options: [],
                    };
                }
                const sites = await callNetlifyApi<any[]>(HttpMethod.GET, 'sites', auth as any);
                return {
                    disabled: false,
                    options: sites.map((site: any) => ({
                        label: site.name,
                        value: site.id,
                    })),
                };
            },
        }),
        form_id: Property.Dropdown({
            displayName: 'Form',
            description: 'The form to monitor for new submissions.',
            required: true,
            refreshers: ['site_id'], // This dropdown depends on the site_id prop
            async options(propsValue) {
                const { auth, site_id } = propsValue;
                if (!auth || !site_id) {
                    return {
                        disabled: true,
                        placeholder: 'Please select a site first.',
                        options: [],
                    };
                }
                const forms = await callNetlifyApi<any[]>(HttpMethod.GET, `sites/${site_id}/forms`, auth as any);
                return {
                    disabled: false,
                    options: forms.map((form: any) => ({
                        label: form.name,
                        value: form.id,
                    })),
                };
            },
        })
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        "id": "603f7a4b1e5a5c0007a3b3c8",
        "number": 1,
        "email": "test@example.com",
        "name": "Test User",
        "first_name": "Test",
        "last_name": "User",
        "company": "ACME Inc.",
        "summary": "This is a test submission.",
        "body": "Message body here.",
        "data": { "ip": "192.168.1.1" },
        "created_at": "2025-08-29T13:00:00.000Z",
        "site_url": "https://your-site-name.netlify.app"
    },

    async onEnable(context) {
        const { form_id } = context.propsValue;
        const submissions = await callNetlifyApi<Submission[]>(
            HttpMethod.GET,
            `forms/${form_id}/submissions`,
            context.auth,
            undefined,
            { per_page: "1" }
        );
        const lastId = submissions.length > 0 ? submissions[0].id : null;
        await context.store.put(`last_submission_${form_id}`, lastId);
    },

    async onDisable(context) {
        const { form_id } = context.propsValue;
        await context.store.delete(`last_submission_${form_id}`);
    },

    async run(context) {
        const { form_id } = context.propsValue;
        const lastId = await context.store.get<string | null>(`last_submission_${form_id}`);
        
        const submissions = await callNetlifyApi<Submission[]>(
            HttpMethod.GET,
            `forms/${form_id}/submissions`,
            context.auth
        );
        
        if (submissions.length === 0) {
            return [];
        }

        await context.store.put(`last_submission_${form_id}`, submissions[0].id);

        const newSubmissions = [];
        for (const submission of submissions) {
            if (submission.id === lastId) {
                break;
            }
            newSubmissions.push(submission);
        }

        return newSubmissions.reverse();
    },
});