import {
    createTrigger,
    TriggerStrategy,
    OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { gmailAuth } from '../..';
import { GmailRequests } from '../common/data';

export const gmailNewLabelTrigger = createTrigger({
    auth: gmailAuth,
    name: 'gmail_new_label',
    displayName: 'New Label',
    description: 'Triggers when a new label is created.',
    props: {},
    sampleData: {},
    type: TriggerStrategy.POLLING,
    async onEnable(context) {
        const labelsResp = await GmailRequests.getLabels(context.auth as OAuth2PropertyValue);
        const labelIds = labelsResp.body.labels.map((l) => l.id);
        await context.store.put('labelIds', labelIds);
    },
    async onDisable(context) {
        await context.store.delete('labelIds');
    },
    async run(context) {
        const oldLabelIds: string[] = (await context.store.get('labelIds')) ?? [];

        const labelsResp = await GmailRequests.getLabels(context.auth as OAuth2PropertyValue);
        const labels = labelsResp.body.labels;

        const newLabels = labels.filter((l) => !oldLabelIds.includes(l.id));

        const labelIds = labels.map((l) => l.id);
        await context.store.put('labelIds', labelIds);

        return newLabels.map((label) => ({
            id: label.id,
            data: label,
        }));
    },
    async test(context) {
        const labelsResp = await GmailRequests.getLabels(context.auth as OAuth2PropertyValue);
        const labels = labelsResp.body.labels.filter((l) => l.type === 'user');
        return labels.slice(-3).map((label) => ({
            id: label.id,
            data: label,
        }));
    },
});
