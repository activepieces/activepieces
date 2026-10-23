import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListNetworkInterfacesAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_network_interfaces',
	displayName: 'List Network Interfaces',
	description: 'Lists the interfaces attached to a network.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of interfaces (WireGuard, gateways and other connections) attached to a private network, with type, region and provisioning status.',
		idempotent: true,
	},
	props: {
		networkId: Property.ShortText({
			displayName: 'Network ID',
			description: 'Network UUID. Use List Networks to find it.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Only interfaces with this name.',
			required: false,
		}),
		type: Property.ShortText({
			displayName: 'Type',
			description: 'Only interfaces of this type, e.g. "wireguard_interface".',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only interfaces in this provisioning status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Created', value: 'created' },
					{ label: 'Provisioning', value: 'provisioning' },
					{ label: 'Provisioned', value: 'provisioned' },
					{ label: 'Deleting', value: 'deleting' },
				],
			},
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listNetworkInterfaces({
			auth: context.auth,
			networkId: p.networkId,
			query: {
				...telnyxUtils.filterQuery({
					filters: { name: p.name, type: p.type, status: p.status },
				}),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
