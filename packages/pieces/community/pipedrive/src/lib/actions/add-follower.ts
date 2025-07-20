import { pipedriveAuth } from '../../index';
import { createAction, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import {
	fetchDealsOptions,
	fetchOrganizationsOptions,
	fetchPersonsOptions,
	fetchProductsOptions,
	ownerIdProp,
} from '../common/props';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addFollowerAction = createAction({
	auth: pipedriveAuth,
	name: 'add-follower',
	displayName: 'Add Follower',
	description: 'Adds a follower to a deal, person, organization or product.',
	props: {
		followerId: ownerIdProp('Follower', true),
		entity: Property.StaticDropdown({
			displayName: 'Target Object',
			description: 'Type of object to add the follower to.',
			required: true,
			options: {
				disabled: false,
				options: [
					{
						label: 'Deal',
						value: 'deal',
					},
					{
						label: 'Person',
						value: 'person',
					},
					{
						label: 'Organization',
						value: 'organization',
					},
					{
						label: 'Product',
						value: 'product',
					},
				],
			},
		}),
		entityId: Property.Dropdown({
			displayName: 'Target Object ID',
			description: 'ID of the object to add the follower to.',
			refreshers: ['entity'],
			required: true,
			options: async ({ auth, entity }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
						placeholder: 'Please connect your account.',
					};
				}
				if (!entity)
					return {
						disabled: true,
						options: [],
						placeholder: 'Please select entity type.',
					};
				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				let options;
				switch (entity) {
					case 'deal':
						options = await fetchDealsOptions(authValue);
						break;
					case 'person':
						options = await fetchPersonsOptions(authValue);
						break;
					case 'organization':
						options = await fetchOrganizationsOptions(authValue);
						break;
					case 'product':
						options = await fetchProductsOptions(authValue);
						break;
				}

				return {
					disabled: false,
					options: options ?? [],
				};
			},
		}),
	},
	async run(context) {
		const { followerId, entity, entityId } = context.propsValue;

		let endpoint = '';

		switch (entity) {
			case 'deal':
				endpoint = `/deals/${entityId}/followers`;
				break;
			case 'organization':
				endpoint = `/organizations/${entityId}/followers`;
				break;
			case 'person':
				endpoint = `/persons/${entityId}/followers`;
				break;
			case 'product':
				endpoint = `/products/${entityId}/followers`;
				break;
		}

        if (!endpoint) {
            throw new Error(`Invalid object type: ${entity}`);
        }

		const response = await pipedriveApiCall({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: endpoint,
			body: {
				user_id: followerId,
			},
		});

		return response;
	},
});
