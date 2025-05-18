import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL, subscriberId } from '../common/props';
import { manychatAuth } from '../../index';

export const setCustomFieldAction = createAction({
	auth: manychatAuth,
	name: 'setCustomField',
	displayName: 'Set Custom Field',
	description: 'Ass or Updates a custom field value for a user.',
	props: {
		subscriber_id: subscriberId,
		field_id: Property.Dropdown({
			displayName: 'Custom Field',
			refreshers: [],
			required: true,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						placeholder: 'Please connect your account.',
						disabled: true,
						options: [],
					};
				}

				const response = await httpClient.sendRequest<{
					data: Array<{ id: number; name: string; type: string }>;
				}>({
					url: `${BASE_URL}/page/getCustomFields`,
					method: HttpMethod.GET,
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: auth as string,
					},
				});
				return {
					disabled: false,
					options: response.body.data
						.filter((field) => field.type !== 'array')
						.map((field) => ({
							label: field.name,
							value: `${field.id}:::${field.type}`,
						})),
				};
			},
		}),
		field_value: Property.DynamicProperties({
			displayName: 'Field Value',
			required: true,
			refreshers: ['field_id'],
			props: async ({ auth, field_id }) => {
				if (!auth || !field_id) return {};

				const fields: DynamicPropsValue = {};

				const fieldType = (field_id as unknown as string).split(':::')[1];

				switch (fieldType) {
					case 'text':
						fields['value'] = Property.ShortText({
							displayName: 'Value',
							required: true,
						});
						break;
					case 'number':
						fields['value'] = Property.Number({
							displayName: 'Value',
							required: true,
						});
						break;
					case 'date':
					case 'datetime':
						fields['value'] = Property.DateTime({
							displayName: 'Value',
							required: true,
						});
						break;
					case 'boolean':
						fields['value'] = Property.Checkbox({
							displayName: 'Value',
							required: true,
						});
						break;
					default:
						break;
				}
				return fields;
			},
		}),
	},
	async run({ auth, propsValue }) {
		const { subscriber_id, field_id, field_value } = propsValue;

		const setCustomFieldResponse = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${BASE_URL}/subscriber/setCustomField`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth,
			},
			body: {
				subscriber_id,
				field_id: field_id.split(':::')[0],
				field_value: field_value['value'],
			},
		});

		if (setCustomFieldResponse.body.status !== 'success') {
			throw Error(`Unexpected Error occured : ${JSON.stringify(setCustomFieldResponse.body)}`);
		}

		const userResponse = await httpClient.sendRequest<{ data: Record<string, any> }>({
			method: HttpMethod.GET,
			url: `${BASE_URL}/subscriber/getInfo`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth,
			},
			queryParams: {
				subscriber_id: `${subscriber_id}`,
			},
		});

		return userResponse.body.data;
	},
});
