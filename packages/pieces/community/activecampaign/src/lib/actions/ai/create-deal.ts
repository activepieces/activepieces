import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { activeCampaignApi } from '../../common/client';
import { DEAL_OWNER_HINTS } from '../../common/constants';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { dealAiOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const createDealAiAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_deal',
	classification: 'WRITE',
	displayName: 'Create Deal',
	description: 'Creates a deal.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a deal in a pipeline or stage, with a value in the given currency, linked to a contact, an account or both (one is required). Get pipeline and stage IDs from List Deal Pipelines and List Deal Stages, owner IDs from List Users. Pipelines that do not auto-assign owners reject a deal without an owner (422), so set Owner User ID when unsure. Each call creates a deal, so do not repeat it; use Update Deal to change one.',
		idempotent: false,
	},
	outputSchema: dealAiOutputSchema,
	props: {
		title: Property.ShortText({ displayName: 'Title', required: true }),
		value: Property.ShortText({ displayName: 'Value', description: 'The amount as a decimal, such as 1500 or 1234.50.', required: true }),
		currency: Property.ShortText({ displayName: 'Currency', description: '3-letter currency code, such as usd or eur.', required: true }),
		pipeline_id: Property.ShortText({ displayName: 'Pipeline ID', description: 'Give a Pipeline ID, a Stage ID or both.', required: false }),
		stage_id: Property.ShortText({ displayName: 'Stage ID', description: 'Give a Pipeline ID, a Stage ID or both.', required: false }),
		owner_id: Property.ShortText({
			displayName: 'Owner User ID',
			description: 'Required unless the pipeline auto-assigns owners; without it such a pipeline rejects the deal with a 422. Use List Users to find the ID.',
			required: false,
		}),
		contact_id_or_email: aiProps.contactIdOrEmail({ displayName: 'Contact ID or Email', required: false }),
		account_id: Property.ShortText({ displayName: 'Account ID', description: 'Give a Contact ID or Email, an Account ID or both. Use List Accounts to find the ID.', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		status: aiProps.dealStatus,
	},
	async run({ auth, propsValue }) {
		const client = makeClient(auth.props);
		const group = aiInput.optionalNumericId({ value: propsValue.pipeline_id, label: 'Pipeline ID' });
		const stage = aiInput.optionalNumericId({ value: propsValue.stage_id, label: 'Stage ID' });
		if (group === undefined && stage === undefined) {
			throw new Error('Give a Pipeline ID or a Stage ID. Use List Deal Pipelines and List Deal Stages to find them.');
		}
		if (aiInput.optionalText(propsValue.contact_id_or_email) === undefined && aiInput.optionalText(propsValue.account_id) === undefined) {
			throw new Error('Give a Contact ID or Email, an Account ID or both. ActiveCampaign requires a deal to have a contact or an account.');
		}
		const deal = {
			title: aiInput.requireText({ value: propsValue.title, label: 'Title' }),
			value: aiInput.dollarsToCents({ value: propsValue.value, label: 'Value' }),
			currency: aiInput.currencyCode({ value: propsValue.currency, label: 'Currency' }),
			group,
			stage,
			owner: aiInput.optionalNumericId({ value: propsValue.owner_id, label: 'Owner User ID' }),
			contact:
				aiInput.optionalText(propsValue.contact_id_or_email) === undefined
					? undefined
					: await aiInput.resolveContactId({ client, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' }),
			account: aiInput.optionalNumericId({ value: propsValue.account_id, label: 'Account ID' }),
			description: aiInput.optionalText(propsValue.description),
			status: aiInput.dealStatusCode(propsValue.status),
		};
		const response = await activeCampaignApi.withDealOwnerHint({ call: () => client.request({ method: 'POST', path: '/deals', body: { deal } }), hint: DEAL_OWNER_HINTS.ai });
		return { deal: aiOutput.dealSummary(acData.recordAt({ value: response.body, key: 'deal' })) };
	},
});
