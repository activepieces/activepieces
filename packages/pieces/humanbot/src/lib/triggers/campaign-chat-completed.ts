import { createTrigger, PieceAuth, TriggerStrategy } from "@activepieces/pieces-framework";
import { DedupeStrategy, Polling, pollingHelper } from "@activepieces/pieces-common";

export const campaignChatCompleted = createTrigger({
    auth: PieceAuth.None(),
    name: 'campaign_chat_completed_trigger', // Unique name across the piece.
    displayName: 'Campaign Chat Completed', // Display name on the interface.
    description: 'Triggers when the campaign chat is complete.', // Description for the action
    type: TriggerStrategy.POLLING,
    props: {}, // Required properties from the user.
    sampleData: {},
    // Run when the user enable or publish the collection.

    onEnable(ctx): Promise<any> {

        return Promise.resolve(null);
    },
    // Run when the user disable the collection or
    // the old collection is deleted after new one is published.
    onDisable(ctx): Promise<any> {

        return Promise.resolve(null);
    },

    // Trigger implementation, It takes context as parameter.
    // should returns an array of payload, each payload considered
    // a separate flow run.
    run(ctx): Promise<any> {
        return Promise.resolve(null);
    }
});
