import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airparserAuth } from '../../auth';
import { airparserClient, airparserOutputSchemas, requireId, toInbox } from '../../common';

export const createInboxAiAction = createAction({
	auth: airparserAuth,
	name: 'create_inbox',
	classification: 'WRITE',
	displayName: 'Create Inbox',
	description: 'Create a new Airparser inbox.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a new Airparser inbox with a name and a parsing engine (text for text documents, vision for scans and images). Returns the new Inbox ID. Not idempotent: each call creates another inbox, so check List Inboxes first.',
		idempotent: false,
	},
	outputSchema: airparserOutputSchemas.createInbox,
	props: {
		name: Property.ShortText({ displayName: 'Name', description: 'Name of the new inbox.', required: true }),
		llmEngine: Property.StaticDropdown<string>({
			displayName: 'Engine',
			description: 'text for text documents, vision for scans and images. Defaults to text.',
			required: false,
			options: { options: [{ label: 'Text', value: 'text' }, { label: 'Vision', value: 'vision' }] },
		}),
	},
	async run(context) {
		const name = requireId({ value: context.propsValue.name, label: 'Name' });
		const llmEngine = context.propsValue.llmEngine === 'vision' ? 'vision' : 'text';
		const response = await airparserClient.call({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: '/inboxes/create',
			operation: 'create inbox',
			body: { name, llm_engine: llmEngine },
		});
		const inbox = toInbox({ raw: response });
		return { ...inbox, name: inbox.name ?? name, llm_engine: inbox.llm_engine ?? llmEngine };
	},
});
