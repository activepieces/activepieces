import { Property, createAction } from '@activepieces/pieces-framework';
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
	props: {
		dealId: activecampaignCommon.dealId,
		title: Property.ShortText({ displayName: 'Title', required: false }),
		value: Property.ShortText({ displayName: 'Value', description: 'The amount as a decimal, such as 1500 or 1234.50.', required: false }),
		currency: Property.ShortText({ displayName: 'Currency', description: '3-letter currency code, such as usd or eur.', required: false }),
		pipelineId: activecampaignCommon.pipelineId(false),
		stageId: activecampaignCommon.stageId(false),
		ownerId: activecampaignCommon.userId({
			displayName: 'Owner',
			description: 'Needed when moving a deal without an owner into a pipeline that does not auto-assign owners.',
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
