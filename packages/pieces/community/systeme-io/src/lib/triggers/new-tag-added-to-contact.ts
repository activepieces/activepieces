import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeWebhook } from '../common/webhook';
import { contactSample } from '../common/samples';
import { newTagAddedToContactTriggerOutputSchema } from '../output-schemas';
import { tagPicker } from '../common/dropdowns';

export const newTagAddedToContact = createTrigger({
    auth: systemeIoAuth,
    name: 'newTagAddedToContact',
    classification: 'READ',
    displayName: 'New Tag Added to Contact',
    description: 'Fires when a tag is assigned to a contact (optionally only a chosen tag)',
    aiMetadata: {
      description: 'Fires when a tag is added to a contact in Systeme.io, delivering the affected contact and the tag that was added. Fires for every tag unless the optional tag filter is set. Use to react to a contact being labeled or entering a tag-based segment.',
    },
    props: {
        tag: tagPicker({
            required: false,
            displayName: 'Only for Tag',
            description: 'Optional. Pick a tag to run the flow only when that tag is added. Leave empty to run for every tag.',
        }),
    },
    sampleData: {
        contact: contactSample,
        tag: { id: 2, name: 'another_tag' },
    },
    outputSchema: newTagAddedToContactTriggerOutputSchema,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        await systemeWebhook.enable({
            auth: context.auth,
            webhookUrl: context.webhookUrl,
            store: context.store,
            event: 'CONTACT_TAG_ADDED',
            prefix: 'new_tag_added',
        });
    },
    async onDisable(context) {
        await systemeWebhook.disable({ auth: context.auth, store: context.store, prefix: 'new_tag_added' });
    },
    async run(context) {
        if (!(await systemeWebhook.accept({ store: context.store, payload: context.payload, prefix: 'new_tag_added' }))) {
            return [];
        }
        return systemeWebhook.tagEvent({ body: context.payload.body, tagFilter: context.propsValue.tag });
    }
});
