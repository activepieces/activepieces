import { pipedriveAuth } from '../../index';
import { createAction, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { fetchOwnersOptions, retriveObjectCustomProperties } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, OrganizationCreateResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';

export const createProductAction = createAction({
	auth: pipedriveAuth,
	name: 'create-product',
	displayName: 'Create Product',
	description: 'Creates a new product.',
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
		code: Property.ShortText({
			displayName: 'Code',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			required: false,
		}),
		unit: Property.ShortText({
			displayName: 'Unit',
			required: false,
		}),
		tax: Property.Number({
			displayName: 'Tax percentage',
			required: false,
		}),
		isActive: Property.Checkbox({
			displayName: 'Is Active ?',
			required: false,
		}),
		ownerId: Property.Dropdown({
			displayName: 'Owner',
			refreshers: [],
			required: false,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account.',
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				const options = await fetchOwnersOptions(authValue);

				return {
					disabled: false,
					options,
				};
			},
		}),
		currency: Property.ShortText({
			displayName: 'Currency',
			required: false,
			description: 'Please enter currency code.',
		}),
		price: Property.Number({
			displayName: 'Price',
			required: false,
		}),
		cost: Property.Number({
			displayName: 'Cost',
			required: false,
		}),
		overheadCost: Property.Number({
			displayName: 'Overhead Cost',
			required: false,
		}),
		visibleTo: Property.StaticDropdown({
			displayName: 'Visible To',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: 'Item Owner',
						value: 1,
					},
					{
						label: 'All Users',
						value: 3,
					},
				],
			},
		}),
		customfields: Property.DynamicProperties({
			displayName: 'Custom Fields',
			refreshers: [],
			required: false,
			props: async ({ auth }) => {
				if (!auth) return {};

				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				return await retriveObjectCustomProperties(authValue, 'product');
			},
		}),
	},
	async run(context) {
		const {
			name,
			code,
			description,
			unit,
			tax,
			isActive,
			ownerId,
			currency,
			price,
			cost,
			overheadCost,
			visibleTo,
		} = context.propsValue;

		const customFields = context.propsValue.customfields ?? {};

		const productDefaultFields: Record<string, any> = {
			name,
			code,
			description,
			unit,
			tax,
			active_flag: isActive,
			owner_id: ownerId,
			prices: [
				{
					price: price ?? 0,
					currency: currency??'USD',
					cost: cost ?? 0,
					overhead_cost: overheadCost ?? 0,
				},
			],
			visible_to: visibleTo,
		};

		const productCustomFields: Record<string, any> = {};

		Object.entries(customFields).forEach(([key, value]) => {
			// Format values if they are arrays
			productCustomFields[key] = Array.isArray(value) ? value.join(',') : value;
		});

		const createdProductResponse = await pipedriveApiCall<OrganizationCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/products',
			body: {
				...productDefaultFields,
				...productCustomFields,
			},
		});

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/productFields',
		});

		const updatedProductProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			createdProductResponse.data,
		);

		return {
			...createdProductResponse,
			data: updatedProductProperties,
		};
	},
});
