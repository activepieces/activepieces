import { Property, createAction } from '@activepieces/pieces-framework';
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
	description: 'Creates a deal in a pipeline stage, linked to a contact, an account or both.',
	audience: 'human',
	aiMetadata: {
		description: 'Creates a deal in a pipeline stage. Each call creates a deal.',
		idempotent: false,
	},
	outputSchema: rawDealOutputSchema,
	props: {
		title: Property.ShortText({ displayName: 'Title', required: true }),
		value: Property.ShortText({ displayName: 'Value', description: 'The amount as a decimal, such as 1500 or 1234.50.', required: true }),
		currency: Property.ShortText({ displayName: 'Currency', description: '3-letter currency code, such as usd or eur.', required: true, defaultValue: 'usd' }),
		pipelineId: activecampaignCommon.pipelineId(true),
		stageId: activecampaignCommon.stageId(true),
		ownerId: activecampaignCommon.userId({
			displayName: 'Owner',
			description: 'Required when the pipeline does not auto-assign owners; otherwise ActiveCampaign rejects the deal.',
			required: false,
		}),
		contactId: activecampaignCommon.optionalContactId,
		accountId: activecampaignCommon.optionalAccountId,
		description: Property.LongText({ displayName: 'Description', required: false }),
		status: Property.StaticDropdown<string>({
			displayName: 'Status',
			description: 'Defaults to open.',
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
