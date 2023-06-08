import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { removeWebhookUrl, storeWebhookUrl } from '../common/data';

export const teamMemberAddedProject = createTrigger({
    name: 'new_team_member_project',
    displayName: 'Team Member Added To Project',
    description: 'Triggers when a new member is added to a row',
    props: {
        api_key: promaProps.api_key,
        workspace_id: promaProps.workspace_id(true),
        table_id: promaProps.table_id(true),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData:
    {
        memberAdded: {
            firstName: "Shyam",
            lastName: "Poudel",
            userId: "958569958559",
            ROWID: "43598349523",
            organizationId: "98575748485"
        },
        data: {
            "C3": "There ",
            "URL": "google.com",
            "Index": "9",
            "ROWID": "9417000001636645",
            "Members": [{
                firstName: "Shyam",
                lastName: "Poudel",
                userId: "958569958559",
                ROWID: "43598349523",
                organizationId: "98575748485"
            }]
        }
    },
    async onEnable(context) {
        const api_key = context.propsValue.api_key;
        const resp = await storeWebhookUrl({
            api_key,
            trigger_type: 'teamMemberAddedToProject',
            table_id: context.propsValue.table_id,
            webhook_url: context.webhookUrl,
        });
        await context.store?.put<{ ROWID: string }>('_new_team_member_project_trigger', {
            ROWID: resp.ROWID,
        });
    },
    async onDisable(context) {
        const api_key = context.propsValue.api_key;
        const response = await context.store?.get<{ ROWID: string }>(
            '_new_team_member_project_trigger'
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
