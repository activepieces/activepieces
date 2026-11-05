import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListPhoneNumbersAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_phone_numbers',
	displayName: 'List Phone Numbers',
	description: 'Lists phone numbers on the account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of phone numbers owned by the account with their id, status, connection, messaging profile and tags. Use it to find the Phone Number ID other actions take.',
		idempotent: true,
	},
	props: {
		phoneNumber: Property.ShortText({
			displayName: 'Phone Number',
			description:
				'Only return this number or numbers containing these digits, e.g. "+13125550001".',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only return numbers in this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'purchase-pending', value: 'purchase-pending' },
					{ label: 'purchase-failed', value: 'purchase-failed' },
					{ label: 'port-pending', value: 'port-pending' },
					{ label: 'active', value: 'active' },
					{ label: 'deleted', value: 'deleted' },
					{ label: 'port-failed', value: 'port-failed' },
					{ label: 'emergency-only', value: 'emergency-only' },
					{ label: 'ported-out', value: 'ported-out' },
					{ label: 'port-out-pending', value: 'port-out-pending' },
				],
			},
		}),
		tag: Property.ShortText({
			displayName: 'Tag',
			description: 'Only return numbers with this tag.',
			required: false,
		}),
		connectionId: telnyxAiProps.connectionId({ required: false }),
		customerReference: Property.ShortText({
			displayName: 'Customer Reference',
			description: 'Only return numbers with this customer reference.',
			required: false,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Field to sort by.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Purchased at', value: 'purchased_at' },
					{ label: 'Phone number', value: 'phone_number' },
					{ label: 'Connection name', value: 'connection_name' },
					{ label: 'Usage payment method', value: 'usage_payment_method' },
				],
			},
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listPhoneNumbersPage({
			auth: context.auth,
			query: {
				...telnyxUtils.filterQuery({
					filters: {
						phone_number: p.phoneNumber,
						status: p.status,
						tag: p.tag,
						connection_id: p.connectionId,
						customer_reference: p.customerReference,
					},
				}),
				...telnyxUtils.toQuery({ values: { sort: p.sort } }),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
