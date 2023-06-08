import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { removeWebhookUrl, storeWebhookUrl } from '../common/data';

export const teamMemberAddedOrganization = createTrigger({
    name: 'new_team_member_org',
    displayName: 'Team Member Added To Organization',
    description: 'Triggers when a new member is added to organization',
    props: {
        api_key: promaProps.api_key,
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData:
    {
        firstName: "Shyam",
        lastName: "Poudel",
        userId: "958569958559",
        ROWID: "43598349523",
        organizationId: "98575748485"
    },
    async onEnable(context) {
        const api_key = context.propsValue.api_key;
        const resp = await storeWebhookUrl({
            api_key,
            trigger_type: 'teamMemberAddedToOrg',
            // organization_id: context.propsValue.organization_id || '',
            table_id: '',
            webhook_url: context.webhookUrl,
        });
        await context.store?.put<{ ROWID: string }>('_new_team_member_org_trigger', {
            ROWID: resp.ROWID,
        });
    },
    async onDisable(context) {
        const api_key = context.propsValue.api_key;
        const response = await context.store?.get<{ ROWID: string }>(
            '_new_team_member_org_trigger'
        );
        if (response !== null && response !== undefined) {
            await removeWebhookUrl({ id: response.ROWID, api_key });
        }
    },
    async run(context) {
        const body = context.payload.body;
        return [body];
    },
});
