import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUpdateNumberOrderAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_number_order',
	displayName: 'Update Number Order',
	description: 'Updates the customer reference or regulatory requirements of a number order.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Updates a number order's customer reference and/or submits its regulatory requirement values. Only the fields you set are sent.",
		idempotent: true,
	},
	props: {
		numberOrderId: Property.ShortText({
			displayName: 'Number Order ID',
			description: 'Number order ID, returned by Create Number Order or List Number Orders.',
			required: true,
		}),
		customerReference: Property.ShortText({
			displayName: 'Customer Reference',
			description: 'Your own reference for the order.',
			required: false,
		}),
		regulatoryRequirements: Property.Json({
			displayName: 'Regulatory Requirements',
			description: 'Optional JSON array, e.g. [{"requirement_id":"<id>","field_value":"<value>"}].',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.updateNumberOrder({
			auth: context.auth,
			numberOrderId: p.numberOrderId,
			body: telnyxUtils.compact({
				values: {
					customer_reference: p.customerReference,
					regulatory_requirements: p.regulatoryRequirements,
				},
			}),
		});
	},
});
