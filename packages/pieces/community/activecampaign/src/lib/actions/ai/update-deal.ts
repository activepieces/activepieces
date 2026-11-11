import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { activeCampaignApi } from '../../common/client';
import { DEAL_OWNER_HINTS } from '../../common/constants';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { dealAiOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const updateDealAiAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_update_deal',
	classification: 'WRITE',
	displayName: 'Update Deal',
	description: 'Updates a deal.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Changes a deal\'s title, value, currency, pipeline, stage, owner, contact, account, description or status (open, won, lost); fields you leave empty are not sent. Find the deal with List Deals. Safe to repeat with the same input.',
		idempotent: true,
	},
	outputSchema: dealAiOutputSchema,
	props: {
		deal_id: Property.ShortText({ displayName: 'Deal ID', description: 'Use List Deals to find the ID.', required: true }),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		value: Property.ShortText({ displayName: 'Value', description: 'The amount as a decimal, such as 1500 or 1234.50.', required: false }),
		currency: Property.ShortText({ displayName: 'Currency', description: '3-letter currency code, such as usd or eur.', required: false }),
		pipeline_id: Property.ShortText({ displayName: 'Pipeline ID', description: 'Use List Deal Pipelines to find the ID.', required: false }),
		stage_id: Property.ShortText({ displayName: 'Stage ID', description: 'Use List Deal Stages to find the ID.', required: false }),
		owner_id: Property.ShortText({
			displayName: 'Owner User ID',
			description: 'Use List Users to find the ID. Needed when moving a deal without an owner into a pipeline that does not auto-assign owners.',
			required: false,
		}),
		contact_id_or_email: aiProps.contactIdOrEmail({ displayName: 'Contact ID or Email', required: false }),
		account_id: Property.ShortText({ displayName: 'Account ID', description: 'Use List Accounts to find the ID.', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		status: aiProps.dealStatus,
	},
	async run({ auth, propsValue }) {
		const client = makeClient(auth.props);
		const dealId = aiInput.numericId({ value: propsValue.deal_id, label: 'Deal ID' });
		const changes = {
			title: aiInput.optionalText(propsValue.title),
			value: aiInput.optionalText(propsValue.value) === undefined ? undefined : aiInput.dollarsToCents({ value: propsValue.value, label: 'Value' }),
			currency: aiInput.currencyCode({ value: propsValue.currency, label: 'Currency' }),
			group: aiInput.optionalNumericId({ value: propsValue.pipeline_id, label: 'Pipeline ID' }),
			stage: aiInput.optionalNumericId({ value: propsValue.stage_id, label: 'Stage ID' }),
			owner: aiInput.optionalNumericId({ value: propsValue.owner_id, label: 'Owner User ID' }),
			contact:
				aiInput.optionalText(propsValue.contact_id_or_email) === undefined
					? undefined
					: await aiInput.resolveContactId({ client, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' }),
			account: aiInput.optionalNumericId({ value: propsValue.account_id, label: 'Account ID' }),
			description: aiInput.optionalText(propsValue.description),
			status: aiInput.dealStatusCode(propsValue.status),
		};
		const deal = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined));
		if (Object.keys(deal).length === 0) {
			throw new Error('Nothing to update: give at least one field to change.');
		}
		const path = `/deals/${activeCampaignApi.segment(dealId)}`;
		const response = await activeCampaignApi.withDealOwnerHint({ call: () => client.request({ method: 'PUT', path, body: { deal } }), hint: DEAL_OWNER_HINTS.ai });
		return { deal: aiOutput.dealSummary(acData.recordAt({ value: response.body, key: 'deal' })) };
	},
});

