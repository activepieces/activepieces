import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { removeWebhookUrl, storeWebhookUrl } from '../common/data';

export const teamMemberAddedWorkspace = createTrigger({
    name: 'new_team_member_ws',
    displayName: 'Team Member Added To Workspace',
    description: 'Triggers when a new member is added to workspace',
    props: {
        api_key: promaProps.api_key,
        workspace_id: promaProps.workspace_id(true)
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData:
    {
    },
    async onEnable(context) {
        const api_key = context.propsValue.api_key;
        const workspace_id = context.propsValue.workspace_id;
        const resp = await storeWebhookUrl({
            api_key,
            trigger_type: 'teamMemberAddedToWs',
            // organization_id: context.propsValue.organization_id || '',
            workspace_id: workspace_id,
            table_id: '',
            webhook_url: context.webhookUrl,
        });
        await context.store?.put<{ ROWID: string }>('_new_team_member_ws_trigger', {
            ROWID: resp.ROWID,
        });
    },
    async onDisable(context) {
        const api_key = context.propsValue.api_key;
        const response = await context.store?.get<{ ROWID: string }>(
            '_new_team_member_ws_trigger'
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
