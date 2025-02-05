import { googleDocsAuth } from "../../index";
import { DedupeStrategy, Polling, pollingHelper } from "@activepieces/pieces-common";
import { createTrigger, PiecePropValueSchema, TriggerStrategy } from "@activepieces/pieces-framework";

const polling:Polling<PiecePropValueSchema<typeof googleDocsAuth>,{}>={
    strategy:DedupeStrategy.TIMEBASED,
    async items({auth,propsValue,lastFetchEpochMS})
    {
        return[];
    }
}

export const newDocumentTrigger = createTrigger({
    auth:googleDocsAuth,
    name:'new-document',
    displayName:'New Document',
    description:'Triggers when a new document is added to a specific folder(optional).',
    type:TriggerStrategy.POLLING,
    props:{},
    async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
    sampleData:{}
})