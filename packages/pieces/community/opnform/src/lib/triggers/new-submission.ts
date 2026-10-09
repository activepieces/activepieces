import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { opnformAuth } from '../auth';
import { opnformApi } from '../common/api';
import { opnformProps } from '../common/props';
import type { OpnformAuthValue } from '../common/types';

export const newSubmissionTrigger = createTrigger({
    auth: opnformAuth,
    name: 'new_submission',
    classification: 'READ',
    displayName: 'New Submission',
    description: 'Triggers when Opnform receives a new submission.',
    aiMetadata: {
        description: 'Fires whenever the specified OpnForm form receives a new submission (someone fills out and submits the form). The event payload contains the form title, slug, and the submitted answers keyed by field id, each with its value and field name. Use it to react to incoming form responses such as contact requests, signups, or survey answers.',
    },
    props: {
        workspaceId: opnformProps.workspaceId({ required: true }),
        formId: opnformProps.formId({ required: true }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        form_title: 'My Form',
        form_slug: 'my-form-vuep24',
        data: {
            '6cc0dcf4-0ca8-43e4-b31a-b3f3413f859a': {
                value: 'This is test',
                name: 'Name',
            },
            '6e171bce-3eab-47a4-a289-20a0cb8ec693': {
                value: 'abc@example.com',
                name: 'Email',
            },
        },
    },
    async onEnable(context) {
        const formId = context.propsValue['formId'];
        const webhookUrl = context.webhookUrl;
        if (!formId) {
            throw new Error('Form is required');
        }

        const flowUrl = `${new URL(context.server.publicUrl).origin}/projects/${
            context.project.id
        }/flows/${context.flows.current.id}`;

        const integrationId = await createOrUpdateIntegration({
            auth: context.auth,
            formId,
            webhookUrl,
            flowUrl,
        });

        if (integrationId) {
            await context.store?.put<WebhookInformation>('_new_submission_trigger', {
                integrationId,
            });
        } else {
            throw new Error('Failed to create integration');
        }
    },
    async onDisable(context) {
        const response = await context.store?.get<WebhookInformation>('_new_submission_trigger');
        if (response !== null && response !== undefined && response.integrationId) {
            const formId = context.propsValue['formId'];
            if (!formId) {
                throw new Error('Form is required');
            }
            await opnformApi.deleteIntegration({
                auth: context.auth,
                formId,
                integrationId: response.integrationId,
            });
        }
    },
    async run(context) {
        return [context.payload.body];
    },
});

async function createOrUpdateIntegration({
    auth,
    formId,
    webhookUrl,
    flowUrl,
}: {
    auth: OpnformAuthValue;
    formId: string;
    webhookUrl: string;
    flowUrl: string;
}): Promise<number | null> {
    const integrations = await opnformApi.listIntegrations({ auth, formId });
    const existingIntegration = integrations.find(
        (integration) =>
            integration.integration_id === 'activepieces' &&
            integration.data?.provider_url === flowUrl,
    );

    if (existingIntegration) {
        if (existingIntegration.data?.webhook_url === webhookUrl) {
            return existingIntegration.id;
        }
        await opnformApi.deleteIntegration({ auth, formId, integrationId: existingIntegration.id });
    }

    return await opnformApi.createIntegration({ auth, formId, webhookUrl, flowUrl });
}

type WebhookInformation = {
    integrationId: number;
};
