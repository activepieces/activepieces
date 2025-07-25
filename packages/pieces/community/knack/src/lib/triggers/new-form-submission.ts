import { createTrigger, Property, TriggerStrategy, TriggerHookContext } from '@activepieces/pieces-framework';
import { TriggerContext } from '@activepieces/pieces-framework';
import { knackAuth } from '../auth';
import { makeClient } from '../client';

export const newFormSubmission = createTrigger({
    name: 'new_form_submission',
    displayName: 'New Form Submission',
    description: 'Triggers when a form is submitted in a live Knack app',
    type: TriggerStrategy.POLLING,
    auth: knackAuth,
    props: {
        formKey: Property.ShortText({
            displayName: 'Form Key',
            description: 'The key of the form to monitor',
            required: true,
        }),
        pollingInterval: Property.Number({
            displayName: 'Polling Interval',
            description: 'How often to check for new submissions (in seconds)',
            defaultValue: 300,
            required: true,
        }),
    },
    sampleData: {
        "id": "5f7c3b6d8e9f4c1234567890",
        "field_1": "Sample response",
        "field_2": "Another response",
        "submitted": "2025-07-25T10:30:00.000Z"
    },
    async test(context: TriggerContext) {
        const client = makeClient(context.auth);
        const response = await client.get(`/forms/${context.propsValue.formKey}/submissions`, {
            params: {
                limit: 1,
                sort_field: "submitted",
                sort_order: "desc"
            }
        });
        return response.data.records || [];
    },
    async onEnable(context: TriggerContext) {
        // Store the latest submission timestamp to use as a starting point
        const client = makeClient(context.auth);
        const response = await client.get(`/forms/${context.propsValue.formKey}/submissions`, {
            params: {
                limit: 1,
                sort_field: "submitted",
                sort_order: "desc"
            }
        });
        
        if (response.data.records?.length > 0) {
            const latestSubmission = response.data.records[0];
            context.store.put('lastSubmissionTime', latestSubmission.submitted);
        }
    },
    async run(context: TriggerContext) {
        const client = makeClient(context.auth);
        const lastSubmissionTime = await context.store.get('lastSubmissionTime');
        
        const response = await client.get(`/forms/${context.propsValue['formKey']}/submissions`, {
            params: {
                limit: 100,
                sort_field: "submitted",
                sort_order: "desc",
                filters: lastSubmissionTime ? {
                    submitted: {
                        $gt: lastSubmissionTime
                    }
                } : undefined
            }
        });

        const submissions = response.data.records || [];
        
        if (submissions.length > 0) {
            await context.store.put('lastSubmissionTime', submissions[0].submitted);
        }

        return submissions;
    },
    
    async onDisable(context: TriggerContext) {
        await context.store.put('lastSubmissionTime', null);
    }
        const client = makeClient(context.auth);
        const lastSubmissionTime = await context.store.get('lastSubmissionTime');
        
        const response = await client.get(`/forms/${context.propsValue.formKey}/submissions`, {
            params: {
                limit: 100,
                sort_field: "submitted",
                sort_order: "desc",
                filters: lastSubmissionTime ? {
                    submitted: {
                        $gt: lastSubmissionTime
                    }
                } : undefined
            }
        });

        const submissions = response.data.records || [];
        
        if (submissions.length > 0) {
            await context.store.put('lastSubmissionTime', submissions[0].submitted);
        }

        return submissions;
    },
});
