import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { activecampaignCommon, makeClient } from '../../common';
import { aiInput } from '../../common/ai-props';
import { activeCampaignApi } from '../../common/client';
import { DEAL_OWNER_HINTS } from '../../common/constants';
import { rawDealOutputSchema } from '../../common/output-schemas';

export const createDealAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_deal_human',
	classification: 'WRITE',
	displayName: 'Create Deal',
	description: 'Creates a deal in a pipeline stage for a contact or an account.',
	audience: 'human',
	aiMetadata: {
		description: 'Creates a deal in a pipeline stage. Each call creates a deal.',
		idempotent: false,
	},
	outputSchema: rawDealOutputSchema,
	propertyGroups: [
		{ key: 'deal', display: 'section', label: 'Deal', icon: 'text', props: ['title', 'value', 'currency', 'description'] },
		{ key: 'pipeline', display: 'section', label: 'Stage and Owner', icon: 'filter', props: ['pipelineId', 'stageId', 'ownerId', 'status'] },
		{ key: 'links', display: 'section', label: 'Linked To', icon: 'users', props: ['linkNote', 'contactId', 'accountId'] },
	],
	props: {
		title: Property.ShortText({ displayName: 'Title', required: true }),
		value: Property.ShortText({ displayName: 'Value', description: 'A decimal amount.', placeholder: '1500.00', required: true, width: 'half' }),
		currency: Property.ShortText({ displayName: 'Currency', description: 'A 3-letter code.', placeholder: 'usd', required: true, defaultValue: 'usd', width: 'half' }),
		pipelineId: activecampaignCommon.pipelineId(true),
		stageId: activecampaignCommon.stageId(true),
		ownerId: activecampaignCommon.userId({
			displayName: 'Owner',
			description: 'Needed if the deal has no owner and the pipeline does not assign one.',
			required: false,
		}),
		linkNote: Property.MarkDown({
			value: 'A deal needs a contact, an account, or both.',
			variant: MarkdownVariant.INFO,
		}),
		contactId: activecampaignCommon.optionalContactId,
		accountId: activecampaignCommon.optionalAccountId,
		description: Property.LongText({ displayName: 'Description', required: false }),
		status: Property.StaticDropdown<string>({
			displayName: 'Status',
			description: 'Defaults to open.',
			required: false,
			display: 'cards',
			options: {
				disabled: false,
				options: [
					{ label: 'Open', value: 'open', description: 'Still being worked' },
					{ label: 'Won', value: 'won', description: 'Closed as a sale' },
					{ label: 'Lost', value: 'lost', description: 'Closed without a sale' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const contact = aiInput.optionalText(propsValue.contactId);
		const account = aiInput.optionalText(propsValue.accountId);
		if (contact === undefined && account === undefined) {
			throw new Error('Choose a Contact, an Account or both. ActiveCampaign requires a deal to have a contact or an account.');
		}
		const deal = {
			title: propsValue.title,
			value: aiInput.dollarsToCents({ value: propsValue.value, label: 'Value' }),
			currency: aiInput.currencyCode({ value: propsValue.currency, label: 'Currency' }),
			group: propsValue.pipelineId,
			stage: propsValue.stageId,
			owner: aiInput.optionalText(propsValue.ownerId),
			contact,
			account,
			description: aiInput.optionalText(propsValue.description),
			status: aiInput.dealStatusCode(propsValue.status),
		};
		const client = makeClient(auth.props);
		return (await activeCampaignApi.withDealOwnerHint({ call: () => client.request({ method: 'POST', path: '/deals', body: { deal } }), hint: DEAL_OWNER_HINTS.human })).body;
	},
});
