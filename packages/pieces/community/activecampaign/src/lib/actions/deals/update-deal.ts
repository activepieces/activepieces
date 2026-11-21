import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { activecampaignCommon, makeClient } from '../../common';
import { aiInput } from '../../common/ai-props';
import { activeCampaignApi } from '../../common/client';
import { DEAL_OWNER_HINTS } from '../../common/constants';
import { rawDealOutputSchema } from '../../common/output-schemas';

export const updateDealAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_update_deal_human',
	classification: 'WRITE',
	displayName: 'Update Deal',
	description: 'Updates a deal. Fields left empty keep their current value.',
	audience: 'human',
	aiMetadata: {
		description: 'Updates the fields of a deal that are filled in. Safe to repeat with the same input.',
		idempotent: true,
	},
	outputSchema: rawDealOutputSchema,
	propertyGroups: [
		{ key: 'deal', display: 'section', label: 'Deal to Update', icon: 'text', props: ['dealId', 'emptyFieldsNote'] },
		{ key: 'changes', display: 'section', label: 'Changes', icon: 'sliders', props: ['title', 'value', 'currency', 'description', 'status'] },
		{ key: 'pipeline', display: 'section', label: 'Stage and Owner', icon: 'filter', props: ['pipelineId', 'stageId', 'ownerId'] },
		{ key: 'links', display: 'section', label: 'Linked To', icon: 'users', props: ['contactId', 'accountId'] },
	],
	props: {
		dealId: activecampaignCommon.dealId,
		emptyFieldsNote: Property.MarkDown({
			value: 'Fields left empty keep their current value.',
			variant: MarkdownVariant.INFO,
		}),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		value: Property.ShortText({ displayName: 'Value', description: 'A decimal amount.', placeholder: '1500.00', required: false, width: 'half' }),
		currency: Property.ShortText({ displayName: 'Currency', description: 'A 3-letter code.', placeholder: 'usd', required: false, width: 'half' }),
		pipelineId: activecampaignCommon.pipelineId(false),
		stageId: activecampaignCommon.stageId(false),
		ownerId: activecampaignCommon.userId({
			displayName: 'Owner',
			description: 'Needed if the deal has no owner and the pipeline does not assign one.',
			required: false,
		}),
		contactId: activecampaignCommon.optionalContactId,
		accountId: activecampaignCommon.optionalAccountId,
		description: Property.LongText({ displayName: 'Description', required: false }),
		status: Property.StaticDropdown<string>({
			displayName: 'Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Open', value: 'open' },
					{ label: 'Won', value: 'won' },
					{ label: 'Lost', value: 'lost' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const changes = {
			title: aiInput.optionalText(propsValue.title),
			value: aiInput.optionalText(propsValue.value) === undefined ? undefined : aiInput.dollarsToCents({ value: propsValue.value, label: 'Value' }),
			currency: aiInput.currencyCode({ value: propsValue.currency, label: 'Currency' }),
			group: aiInput.optionalText(propsValue.pipelineId),
			stage: aiInput.optionalText(propsValue.stageId),
			owner: aiInput.optionalText(propsValue.ownerId),
			contact: aiInput.optionalText(propsValue.contactId),
			account: aiInput.optionalText(propsValue.accountId),
			description: aiInput.optionalText(propsValue.description),
			status: aiInput.dealStatusCode(propsValue.status),
		};
		const deal = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined));
		if (Object.keys(deal).length === 0) {
			throw new Error('Nothing to update: fill in at least one field.');
		}
		const path = `/deals/${activeCampaignApi.segment(propsValue.dealId)}`;
		const client = makeClient(auth.props);
		return (await activeCampaignApi.withDealOwnerHint({ call: () => client.request({ method: 'PUT', path, body: { deal } }), hint: DEAL_OWNER_HINTS.human })).body;
	},
});
