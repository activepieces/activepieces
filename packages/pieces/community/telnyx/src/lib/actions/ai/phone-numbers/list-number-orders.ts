import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListNumberOrdersAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_number_orders',
	displayName: 'List Number Orders',
	description: 'Lists phone number purchase orders.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of number orders with their status, numbers, connection and messaging profile. Filter by status, customer reference, creation time or whether requirements are met.',
		idempotent: true,
	},
	props: {
		status: Property.ShortText({
			displayName: 'Status',
			description: 'Only return orders in this status, e.g. "pending", "success" or "failure".',
			required: false,
		}),
		customerReference: Property.ShortText({
			displayName: 'Customer Reference',
			description: 'Only return orders with this customer reference.',
			required: false,
		}),
		createdAfter: Property.DateTime({
			displayName: 'Created After',
			description: 'Only return orders created after this time.',
			required: false,
		}),
		createdBefore: Property.DateTime({
			displayName: 'Created Before',
			description: 'Only return orders created before this time.',
			required: false,
		}),
		requirementsMet: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Requirements Met',
			description:
				'Only return orders whose regulatory requirements are (Yes) or are not (No) met.',
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listNumberOrders({
			auth: context.auth,
			query: {
				...telnyxUtils.toQuery({
					values: {
						'filter[status]': p.status,
						'filter[customer_reference]': p.customerReference,
						'filter[created_at][gt]': p.createdAfter,
						'filter[created_at][lt]': p.createdBefore,
						'filter[requirements_met]': p.requirementsMet,
					},
				}),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
