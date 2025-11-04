import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../';
import { customFields, leadId, statusId, userId } from '../common/props';
import { closeApiCall } from '../common/client';

export const createOpportunity = createAction({
	auth: closeAuth,
	name: 'create_opportunity',
	displayName: 'Create Opportunity',
	description: 'Create a new opportunity.',
	props: {
		lead_id: leadId(),
		status_id: statusId('opportunity', true),
		name: Property.ShortText({
			displayName: 'Opportunity Name',
			description: 'A descriptive name for the opportunity.',
			required: false,
		}),
		note: Property.LongText({
			displayName: 'Notes',
			description: 'Additional details about the opportunity.',
			required: false,
		}),
		confidence: Property.Number({
			displayName: 'Confidence %',
			description: 'The probability of winning this opportunity (0-100).',
			required: false,
		}),
		value: Property.Number({
			displayName: 'Value',
			required: false,
		}),
		value_period: Property.StaticDropdown({
			displayName: 'Value Period',
			description: 'The period for the opportunity value.',
			required: false,
			options: {
				options: [
					{ label: 'One-Time', value: 'one_time' },
					{ label: 'Monthly', value: 'monthly' },
					{ label: 'Annual', value: 'annual' },
				],
			},
			defaultValue: 'one_time',
		}),
		contact_id: Property.ShortText({
			displayName: 'Contact ID',
			description: 'The ID of the contact associated with this opportunity.',
			required: false,
		}),
		user_id: userId(),
		custom_fields: customFields('opportunity'),
	},
	async run(context) {
		const { lead_id, name, note, status_id, confidence, value, value_period, contact_id, user_id } =
			context.propsValue;

		const customFields = context.propsValue.custom_fields ?? {};

		const transformedCustomFields = Object.fromEntries(
			Object.entries(customFields)
				.filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && v.length === 0))
				.map(([key, value]) => [`custom.${key}`, value]),
		);

		const opportunityData = {
			lead_id,
			status_id,
			name,
			note,
			confidence,
			value,
			value_period,
			contact_id,
			user_id,
			...transformedCustomFields,
		};

		try {
			const response = await closeApiCall({
				accessToken: context.auth,
				method: HttpMethod.POST,
				resourceUri: '/opportunity/',
				body: opportunityData,
			});

			return response;
		} catch (error: any) {
			if (error.response?.status === 400) {
				throw new Error(`Invalid request: ${JSON.stringify(error.response.body)}`);
			}
			if (error.response?.status === 404) {
				throw new Error(`Lead or related resource not found`);
			}
			throw new Error(`Failed to create opportunity: ${error.message}`);
		}
	},
});
