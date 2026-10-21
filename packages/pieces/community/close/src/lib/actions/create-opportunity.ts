import { closeMappers } from '../common/mappers';
import { closeOutputSchemas } from '../common/output-schemas';
import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../auth';
import { customFields, leadId, statusId, userId } from '../common/props';
import { CloseApiError, closeApiCall, closeClient } from '../common/client';

export const createOpportunity = createAction({
	auth: closeAuth,
	name: 'create_opportunity',
	classification: 'WRITE',
	displayName: 'Create Opportunity',
	description: 'Create a new opportunity.',
	audience: 'human',
	aiMetadata: {
		description: 'Creates a new opportunity (deal) on an existing lead in Close CRM, with optional value, value period, confidence, status, contact, and custom fields. Use to log a sales deal against a lead. Requires the lead ID and an opportunity status. Not idempotent; each call creates a separate opportunity.',
		idempotent: false,
	},
	outputSchema: closeOutputSchemas.raw.opportunity,
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
			displayName: 'Value (cents)',
			description: 'Monetary value in cents of your organization currency, e.g. 340000 for $3,400.00.',
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

		closeClient.parseInteger({ value: confidence, label: 'Confidence %', min: 0, max: 100 });
		closeClient.parseInteger({ value, label: 'Value (cents)', min: 0, max: Number.MAX_SAFE_INTEGER });

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
				accessToken: context.auth.secret_text,
				method: HttpMethod.POST,
				resourceUri: '/opportunity/',
				body: opportunityData,
			});

			return closeMappers.withCustomMap({ objectType: 'opportunity', record: response });
		} catch (error) {
			if (error instanceof CloseApiError && error.status === 404) {
				throw new Error(`Lead or related resource not found. ${error.message}`);
			}
			throw error;
		}
	},
});
